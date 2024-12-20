// routes/ganttRoute.ts
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Absence } from '../models/Absence';  // Importe a interface que criamos

const router = express.Router();
const absencesFilePath = path.join(__dirname, '../../data/absences.json'); // Caminho para o arquivo de ausências

// Função para converter data no formato 'DD/MM/YYYY' para 'YYYY-MM-DD'
function convertToISODate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);  
}

// Rota para o gráfico de Gantt
router.get('/', (req: Request, res: Response) => {
    
    // Se a URL contiver parâmetros start e end, usamos eles para calcular a semana
    let startOfWeek = req.query.start ? new Date(req.query.start as string) : new Date();
    let endOfWeek = req.query.end ? new Date(req.query.end as string) : new Date();

    const firstDayOfWeek = new Date(startOfWeek);
    firstDayOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Segunda-feira
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 4); // Sexta-feira


    const formattedStart = firstDayOfWeek.toISOString().split('T')[0];
    const formattedEnd = lastDayOfWeek.toISOString().split('T')[0];


    fs.readFile(absencesFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de ausências:', err);
            return res.status(500).send('Erro ao carregar dados das ausências');
        }

        let absences: Absence[] = [];  
        try {
            absences = JSON.parse(data);
        } catch (parseErr) {
            console.error('Erro ao parsear o JSON de ausências:', parseErr);
            return res.status(500).send('Erro ao processar dados de ausências.');
        }

        // Filtra as ausências que ocorreram durante a semana calculada
        const filteredAbsences = absences.filter(absence => {
            const startDate = convertToISODate(absence.startDate);  
            const endDate = convertToISODate(absence.endDate);  

            // A ausência está no intervalo da semana se a sua data de início ou fim se sobrepõe à semana
            return (startDate <= lastDayOfWeek && endDate >= firstDayOfWeek);
        });

        // Para navegação para a próxima semana e anterior
        const nextWeekStart = new Date(firstDayOfWeek);
        nextWeekStart.setDate(firstDayOfWeek.getDate() + 7);
        const nextWeekEnd = new Date(lastDayOfWeek);
        nextWeekEnd.setDate(lastDayOfWeek.getDate() + 7);

        const previousWeekStart = new Date(firstDayOfWeek);
        previousWeekStart.setDate(firstDayOfWeek.getDate() - 7);
        const previousWeekEnd = new Date(lastDayOfWeek);
        previousWeekEnd.setDate(lastDayOfWeek.getDate() - 7);

       

        // Renderiza a view com as ausências filtradas
        res.render('gantt', { 
            absences: filteredAbsences,
            startOfWeek: new Date(formattedStart).toISOString().split('T')[0],
            endOfWeek: new Date(formattedEnd).toISOString().split('T')[0],
            nextStart: nextWeekStart.toISOString().split('T')[0],
            nextEnd: nextWeekEnd.toISOString().split('T')[0],
            previousStart: previousWeekStart.toISOString().split('T')[0],
            previousEnd: previousWeekEnd.toISOString().split('T')[0]
        });
    });
});

router.get('/ganttMonthly', (req: Request, res: Response) => {
    let monthStart = req.query.month ? new Date(req.query.month as string) : new Date();
    monthStart.setDate(1); // Início do mês

    // Calculando o início e o fim do mês
    let nextMonthStart = new Date(monthStart);
    nextMonthStart.setMonth(monthStart.getMonth() + 1); // Próximo mês
    let previousMonthStart = new Date(monthStart);
    previousMonthStart.setMonth(monthStart.getMonth() - 1); // Mês anterior

    // Calculando o número de dias no mês
    let daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

    fs.readFile(absencesFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de ausências:', err);
            return res.status(500).send('Erro ao carregar dados das ausências');
        }

        let absences: Absence[] = [];
        try {
            absences = JSON.parse(data);
        } catch (parseErr) {
            console.error('Erro ao parsear o JSON de ausências:', parseErr);
            return res.status(500).send('Erro ao processar dados de ausências.');
        }

        // Filtra as ausências durante o mês
        const filteredAbsences = absences.filter(absence => {
            const startDate = convertToISODate(absence.startDate);
            const endDate = convertToISODate(absence.endDate);
            return (startDate <= nextMonthStart && endDate >= monthStart);
        });

        res.render('ganttMonthly', { 
            absences: filteredAbsences,
            monthStart: monthStart.toISOString().split('T')[0],
            daysInMonth,
            previousMonthStart: previousMonthStart.toISOString().split('T')[0],
            nextMonthStart: nextMonthStart.toISOString().split('T')[0]
        });
    });
});

export default router;
