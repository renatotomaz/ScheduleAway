import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import absencesRouter from './routes/index'; 
import ganttRouter from './routes/ganttRoute';


const app = express();

// Configuração para usar EJS como engine de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir arquivos estáticos
const pathToPublic = path.resolve(__dirname, '../public');
app.use(express.static(pathToPublic));

// Middleware para parsear o corpo das requisições
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota principal GET para renderizar o formulário e as ausências
app.get('/', (req: Request, res: Response) => {
  fs.readFile(path.join(__dirname, '../data/employees.json'), 'utf-8', (err, employeeData) => {
    if (err) {
      console.error('Erro ao ler o arquivo de funcionários:', err);
      return res.status(500).send('Erro ao carregar dados dos funcionários');
    }

    const employees = JSON.parse(employeeData);

    fs.readFile(path.join(__dirname, '../data/absences.json'), 'utf-8', (err, absenceData) => {
      let absences = [];
      if (!err) {
        absences = JSON.parse(absenceData);
      }

      res.render('index', { employees, absences });
    });
  });
});

// Adiciona as rotas definidas no arquivo index.ts
app.use('/', absencesRouter); 
// Usando o ganttRouter para a rota /gantt
app.use('/gantt', ganttRouter);


// Porta do servidor
const PORT = parseInt(process.env.PORT || "8085", 10);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


