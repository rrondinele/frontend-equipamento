import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

const API_URL = 'https://backend-equipamento.onrender.com';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [equipamentoFilter, setEquipamentoFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Definir params no escopo da função
      const params = {};
      
      if (equipamentoFilter) {
        params.equipamento = equipamentoFilter
          .split(/[\n,\s]+/)
          .filter(e => e.trim() !== '')
          .join(',');
      }
      
      if (startDate && endDate) {
        params.dataInicial = format(startDate, 'yyyy-MM-dd');
        params.dataFinal = format(endDate, 'yyyy-MM-dd');
      }
  
      const response = await axios.get(`${API_URL}/api/equipamentos`, {
        params,
        timeout: 30000
      });
  
      if (!response.data) {
        throw new Error('Resposta da API sem dados');
      }
  
      setData(response.data);
      
    } catch (err) {
      let errorMessage = 'Erro ao carregar dados';
      
      if (err.response) {
        // Erro com resposta do servidor
        errorMessage = `Erro ${err.response.status}: ${err.response.data?.error || err.message}`;
        console.error('Detalhes do erro:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config.url,
          params: err.config.params // Acessa os params da requisição
        });
      } else if (err.request) {
        // Requisição foi feita mas não houve resposta
        errorMessage = 'Servidor não respondeu - verifique sua conexão';
        console.error('Erro de conexão:', {
          request: err.request,
          url: err.config.url
        });
      } else {
        // Erro ao configurar a requisição
        errorMessage = `Erro na requisição: ${err.message}`;
        console.error('Erro de configuração:', err);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Definir params no escopo da função
      const params = {};
      
      if (equipamentoFilter) {
        params.equipamento = equipamentoFilter
          .split(/[\n,\s]+/)
          .filter(e => e.trim() !== '')
          .join(',');
      }
      
      if (startDate && endDate) {
        params.dataInicial = format(startDate, 'yyyy-MM-dd');
        params.dataFinal = format(endDate, 'yyyy-MM-dd');
      }
  
      const response = await axios.get(`${API_URL}/api/equipamentos/export`, {
        params,
        responseType: 'blob'
      });
      
      saveAs(new Blob([response.data]), 'equipamentos_filtrados.xlsx');
      
    } catch (err) {
      let errorMessage = 'Erro ao exportar dados';
      
      if (err.response) {
        errorMessage = `Erro ${err.response.status}: ${err.response.data?.error || err.message}`;
        console.error('Detalhes do erro na exportação:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config.url,
          params: err.config.params
        });
      } else if (err.request) {
        errorMessage = 'Servidor não respondeu durante a exportação';
        console.error('Erro de conexão na exportação:', err.request);
      } else {
        errorMessage = `Erro na configuração da exportação: ${err.message}`;
        console.error('Erro de configuração na exportação:', err);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Consulta de Equipamentos
      </Typography>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          mb: 2,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <DatePicker
            label="Data Inicial"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => (
              <TextField 
                {...params} 
                size="small" 
                sx={{ width: 150 }}
              />
            )}
          />
          <DatePicker
            label="Data Final"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => (
              <TextField 
                {...params} 
                size="small" 
                sx={{ width: 150 }}
              />
            )}
          />

          <TextField
            label="Equip. Removido"
            value={equipamentoFilter}
            onChange={(e) => setEquipamentoFilter(e.target.value)}
            size="small"
            sx={{ width: 200 }}
            multiline
            rows={1.5}
            placeholder="Cole a lista aqui"
          />
          
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={fetchData}
              size="small"
              sx={{ height: 40 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Filtrar'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleExport}
              size="small"
              sx={{ height: 40 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Exportar'}
            </Button>
          </Box>
        </Box>
      </LocalizationProvider>
  
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
  
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="tabela de equipamentos">
            <TableHead>
              <TableRow sx={{
                backgroundColor: '#1976d2',
                '& th': {
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  padding: '4px 6px',
                  borderBottom: 'none'
                }
              }}>
                <TableCell>Instalação</TableCell>
                <TableCell>Nota</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Descrição Nota</TableCell>
                <TableCell>Alavanca</TableCell>
                <TableCell>Data Conclusão</TableCell>
                <TableCell>Equipamento Removido</TableCell>
                <TableCell>Status Equip. Removido</TableCell>
                <TableCell>Equipamento Instalado</TableCell>
                <TableCell>Status Equip. Instalado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row['Instalação'] || '-'}</TableCell>
                  <TableCell>{row['Nota'] || '-'}</TableCell>
                  <TableCell>{row['Cliente'] || '-'}</TableCell>
                  <TableCell>{row['Texto breve para o code'] || '-'}</TableCell>
                  <TableCell>{row['Alavanca'] || '-'}</TableCell>
                  <TableCell>{formatDate(row['Data Conclusão'])}</TableCell>
                  <TableCell>{row['Equipamento Removido'] || '-'}</TableCell>
                  <TableCell>{row['Status Equip. Removido'] || '-'}</TableCell>
                  <TableCell>{row['Equipamento Instalado'] || '-'}</TableCell>
                  <TableCell>{row['Status Equip. Instalado'] || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default App;