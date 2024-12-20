import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Absence } from '../models/Absence';
import ganttRouter from './ganttRoute'; 

const router = Router();
const absencesFilePath = path.join(__dirname, '../../data/absences.json');
const employeesFilePath = path.join(__dirname, '../../data/employees.json');

// Rota para a página inicial
router.get('/', (req, res) => {
  fs.readFile(employeesFilePath, 'utf-8', (errEmp, dataEmp) => {
    if (errEmp) {
      console.error('Erro ao ler os dados dos funcionários:', errEmp);
      return res.status(500).json({ error: 'Erro ao ler os dados dos funcionários' });
    }

    let employees;
    try {
      employees = JSON.parse(dataEmp);
    } catch (parseErr) {
      console.error('Erro ao parsear JSON dos funcionários:', parseErr);
      return res.status(500).json({ error: 'Erro ao processar dados dos funcionários.' });
    }

    fs.readFile(absencesFilePath, 'utf-8', (errAbs, dataAbs) => {
      if (errAbs) {
        console.error('Erro ao ler o arquivo de ausências:', errAbs);
        return res.status(500).json({ error: 'Erro ao ler o arquivo de ausências' });
      }

      let absences = [];
      try {
        absences = JSON.parse(dataAbs);
      } catch (parseErr) {
        console.error('Erro ao parsear o JSON de ausências:', parseErr);
      }

      // Renderiza a view passando os dados de funcionários e ausências
      res.render('index', { employees, absences });
    });
  });
});

// Rota para cadastrar uma nova ausência
router.post('/absences', (req, res) => {

  const { employeeName, startDate, endDate, reason } = req.body;

  if (!employeeName || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  fs.readFile(absencesFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de ausências:', err);
      return res.status(500).json({ error: 'Erro ao ler o arquivo de ausências.' });
    }

    let absences: Absence[] = [];
    try {
      absences = JSON.parse(data);
    } catch (parseErr) {
      console.error('Erro ao parsear JSON de ausências:', parseErr);
      return res.status(500).json({ error: 'Erro ao processar dados de ausências.' });
    }

    const maxIndex = absences.reduce((max, absence) => (absence.index > max ? absence.index : max), -1);
    const newIndex = maxIndex + 1;

    const newAbsence: Absence = {
      index: newIndex,
      employeeName,
      startDate,
      endDate,
      reason,
    };

    absences.push(newAbsence);

    fs.writeFile(absencesFilePath, JSON.stringify(absences, null, 2), 'utf-8', (writeErr) => {
      if (writeErr) {
        console.error('Erro ao atualizar o arquivo de ausências:', writeErr);
        return res.status(500).json({ error: 'Erro ao salvar os dados de ausências.' });
      }

      res.status(201).json({ success: true, message: 'Ausência cadastrada com sucesso!', newAbsence });
    });
  });
});


// Rota para excluir uma ausência
router.delete('/absences/:id', (req, res) => {
  const absenceIndex = parseInt(req.params.id, 10); // Pega o ID da ausência a partir da URL

  fs.readFile(absencesFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de ausências:', err);
      return res.status(500).json({ error: 'Erro ao ler o arquivo de ausências.' });
    }

    let absences: Absence[] = [];
    try {
      absences = JSON.parse(data);
    } catch (parseErr) {
      console.error('Erro ao parsear JSON de ausências:', parseErr);
      return res.status(500).json({ error: 'Erro ao processar dados de ausências.' });
    }

    // Encontra a ausência com o ID correspondente
    const absenceIndexToRemove = absences.findIndex(absence => absence.index === absenceIndex);

    if (absenceIndexToRemove === -1) {
      return res.status(404).json({ error: 'Ausência não encontrada.' });
    }

    // Remove a ausência do array
    absences.splice(absenceIndexToRemove, 1);

    // Grava o novo array de ausências no arquivo JSON
    fs.writeFile(absencesFilePath, JSON.stringify(absences, null, 2), 'utf-8', (writeErr) => {
      if (writeErr) {
        console.error('Erro ao salvar os dados de ausências:', writeErr);
        return res.status(500).json({ error: 'Erro ao salvar os dados de ausências.' });
      }

      res.status(200).json({ success: true, message: 'Ausência excluída com sucesso.' });
    });
  });
});

// Rota para excluir ausências com data-fim anterior a hoje
// Função para comparar apenas as datas (sem hora)
function compareDates(date1: Date, date2: Date): boolean {
  // Zera as horas, minutos, segundos e milissegundos de ambas as datas
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  // Compara as datas (sem o horário)

  return date1 < date2;
}

router.post('/absences/delete-multiple', (req, res) => {
  const ids = req.body.ids.map((id: any) => id.toString());  // Garante que todos os IDs são strings
  const today = new Date(); // Data atual no fuso horário local
  today.setHours(0, 0, 0, 0); // Ajusta para início do dia, sem considerar a hora


  fs.readFile(absencesFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de ausências:', err);
      return res.status(500).json({ error: 'Erro ao ler o arquivo de ausências.' });
    }

    let absences: Absence[] = [];
    try {
      absences = JSON.parse(data);
    } catch (parseErr) {
      console.error('Erro ao parsear JSON de ausências:', parseErr);
      return res.status(500).json({ error: 'Erro ao processar dados de ausências.' });
    }

    // Função para converter a data no formato 'dd/MM/yyyy' para um objeto Date
    function parseDate(dateString: string): Date {
      const [day, month, year] = dateString.split('/');
      const formattedDate = `${year}-${month}-${day}`;  // Converte para 'yyyy-MM-dd'
      const parsedDate = new Date(formattedDate);
      parsedDate.setHours(0, 0, 0, 0); // Ajusta para o início do dia
      return parsedDate;
    }

    // Cria um novo array sem as ausências que devem ser excluídas
    const newAbsences: Absence[] = [];
    
    for (let i = 0; i < absences.length; i++) {
      const absence = absences[i];
      const endDate = parseDate(absence.endDate);
      // console.log(`Comparando ID: ${absence.index}, Data-fim: ${endDate} com Hoje: ${today}`);

      // Verifica se o ID está na lista de exclusão
      const isIdInList = ids.includes(absence.index.toString());  // Converte o ID para string antes de comparar
      // console.log(`ID ${absence.index} está na lista? ${isIdInList}`);

      // Verifica se a data de fim é anterior a hoje
      const isEndDateBeforeToday = endDate.getTime() < today.getTime();
      // console.log(`Data-fim ${endDate} é anterior a hoje? ${isEndDateBeforeToday}`);

      // Se o ID estiver na lista e a data-fim for anterior a hoje, deve ser excluído
      const shouldDelete = isIdInList && isEndDateBeforeToday;
      // console.log(`ID: ${absence.index} será excluído? ${shouldDelete}`);

      // Se não for para excluir, adiciona no novo array
      if (!shouldDelete) {
        newAbsences.push(absence);
      }
    }

    // Grava as ausências filtradas no arquivo JSON
    fs.writeFile(absencesFilePath, JSON.stringify(newAbsences, null, 2), 'utf-8', (writeErr) => {
      if (writeErr) {
        console.error('Erro ao salvar os dados de ausências:', writeErr);
        return res.status(500).json({ error: 'Erro ao salvar os dados de ausências.' });
      }

      // Responde apenas com o JSON de sucesso
      return res.status(200).json({ success: true, message: 'Ausências excluídas com sucesso.' });
    });
  });
});



export default router;
