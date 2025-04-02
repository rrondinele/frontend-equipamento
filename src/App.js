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

// Estilos customizados
const styles = {
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '16px',
    boxShadow: 3
  },
  table: {
    minWidth: '1200px', // Largura mínima maior para acomodar todas as colunas
  },
  tableHeaderCell: {
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: '500',
    fontSize: '0.875rem',
    padding: '12px 16px',
    borderBottom: 'none',
    whiteSpace: 'nowrap'
  },
  tableCell: {
    padding: '10px 16px',
    whiteSpace: 'nowrap',
    fontSize: '0.8rem' // Reduzido para ~11px (0.75rem = 12px)
  },
  wideColumn: {
    minWidth: '250px'
  },
  mediumColumn: {
    minWidth: '150px'
  },
  filterContainer: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px'
  }
};

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

      console.log("Campos recebidos:", Object.keys(response.data[0]));

      
    } catch (err) {
      let errorMessage = 'Erro ao carregar dados';
      
      if (err.response) {
        errorMessage = `Erro ${err.response.status}: ${err.response.data?.error || err.message}`;
        console.error('Detalhes do erro:', err.response.data);
      } else if (err.request) {
        errorMessage = 'Servidor não respondeu - verifique sua conexão';
      } else {
        errorMessage = `Erro na requisição: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
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
      } else if (err.request) {
        errorMessage = 'Servidor não respondeu - verifique sua conexão';
      } else {
        errorMessage = `Erro na requisição: ${err.message}`;
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}> {/* Alterado para maxWidth="xl" */}
      <Typography variant="h4" component="h1" gutterBottom>
        Consulta de Equipamentos
      </Typography>
      
      <Box sx={styles.filterContainer}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
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
                  sx={{ width: 180 }} // Aumentei a largura
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
                  sx={{ width: 180 }} // Aumentei a largura
                />
              )}
            />

            <TextField
              label="Equip. Removido"
              value={equipamentoFilter}
              onChange={(e) => setEquipamentoFilter(e.target.value)}
              size="small"
              sx={{ width: 250 }} // Aumentei a largura
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui (separar por vírgula ou quebra de linha)"
            />
            
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={fetchData}
                size="medium" // Alterado para medium
                sx={{ height: 40, minWidth: 120 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Filtrar'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleExport}
                size="medium" // Alterado para medium
                sx={{ height: 40, minWidth: 120 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Exportar'}
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
      </Box>
  
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
        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table sx={styles.table} aria-label="tabela de equipamentos">
            <TableHead>
              <TableRow>
                <TableCell sx={styles.tableHeaderCell}>Instalação</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Nota</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Cliente</TableCell>
                <TableCell sx={{ ...styles.tableHeaderCell, ...styles.wideColumn }}>Descrição Nota</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Alavanca</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Data Conclusão</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Equip. Removido</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Material Removido</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Descrição Mat. Removido</TableCell>
                <TableCell sx={{...styles.tableHeaderCell, whiteSpace: 'normal', lineHeight: '1.2', py: 1, textAlign: 'left', width: '100px', minWidth: '100px', maxWidth: '100px'}}>Status Equip.<br />Removido</TableCell>
                {/*<TableCell sx={styles.tableHeaderCell}>Status Equip. Removido</TableCell>*/}
                <TableCell sx={styles.tableHeaderCell}>Equip. Instalado</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Material Instalado</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Descrição Mat. Instalado</TableCell>
                <TableCell sx={{...styles.tableHeaderCell, whiteSpace: 'normal', lineHeight: '1.2', py: 1, textAlign: 'left', width: '100px', minWidth: '100px', maxWidth: '100px'}}>Status Equip.<br />Instalado</TableCell>
                {/*<TableCell sx={styles.tableHeaderCell}>Status Equip. Instalado</TableCell>*/}
               {/*<TableCell sx={{ ...styles.tableHeaderCell, ...styles.mediumColumn }}>Status Equip. Instalado</TableCell>*/}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={styles.tableCell}>{row['Instalação'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Nota'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Cliente'] || '-'}</TableCell>
                  <TableCell sx={{ ...styles.tableCell, whiteSpace: 'normal' }}>{row['Texto breve para o code'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Alavanca'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{formatDate(row['Data Conclusão'])}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Equipamento Removido'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Material Removido'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Descrição Mat. Removido'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Status Equip. Removido'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Equipamento Instalado'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Material Instalado'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Descrição Mat. Instalado'] || '-'}</TableCell>
                  <TableCell sx={styles.tableCell}>{row['Status Equip. Instalado'] || '-'}</TableCell>
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