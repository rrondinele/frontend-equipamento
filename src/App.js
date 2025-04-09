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
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { saveAs } from 'file-saver';

const API_URL = 'https://backend-equipamento.onrender.com';

const styles = {
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '16px',
    boxShadow: 3
  },
  table: {
    minWidth: '1800px',
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
    fontSize: '0.8rem'
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
  const [totalCount, setTotalCount] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [notaFilter, setNotaFilter] = useState('');

  const filtrosPreenchidos = () => {
    const dataOk = startDate && endDate;
    const equipamentoOk = equipamentoFilter.trim() !== '';
    const notaOk = notaFilter.trim() !== '';
    return dataOk || equipamentoOk || notaOk;
  };
  
  const getUltimaData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/equipamentos/ultima-data`);
      if (res.data?.ultimaData) {
        setUltimaAtualizacao(res.data.ultimaData);
      }
    } catch (err) {
      console.warn('Erro ao buscar a data mais recente:', err);
    }
  };  
  
  const fetchData = async (modoExemplo = false) => {
    try {
      setLoading(true);
      setError(null);
  
      // Bloqueia se não for modo exemplo e não tiver filtro
      if (!modoExemplo && !filtrosPreenchidos()) {
        setError('Informe um intervalo de datas ou um Equipamento Removido para continuar.');
        setLoading(false);
        return;
      }
  
      const params = {};
  
      if (!modoExemplo) {
        if (equipamentoFilter) {
          params.equipamento = equipamentoFilter
            .split(/[\n,\s]+/)
            .filter(e => e.trim() !== '')
            .join(',');
        }

        if (notaFilter) {
          params.nota = notaFilter
            .split(/[\n,;\s]+/)
            .filter(e => e.trim() !== '')
            .join(',');
        }
          
        if (startDate && endDate) {
          params.dataInicial = format(startDate, 'yyyy-MM-dd');
          params.dataFinal = format(endDate, 'yyyy-MM-dd');
        }
      }
  
      const response = await axios.get(`${API_URL}/api/equipamentos`, {
        params,
        timeout: 40000
      });
  
      if (!response.data) throw new Error('Resposta da API sem dados');
  
      setData(response.data);
      //setUltimaAtualizacao(response.data[0]?.['Data Conclusão'] ?? null);
      await getUltimaData();

  
      const countRes = await axios.get(`${API_URL}/api/equipamentos/count`, { params });
      setTotalCount(countRes.data.count);
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
  
      if (notaFilter) {
        params.nota = notaFilter
          .split(/[\n,;\s]+/)
          .filter(e => e.trim() !== '')
          .join(',');
      }
  
      if (startDate && endDate) {
        params.dataInicial = format(startDate, 'yyyy-MM-dd');
        params.dataFinal = format(endDate, 'yyyy-MM-dd');
      }
  
      const response = await axios.get(`${API_URL}/api/equipamentos/export`, {
        params,
        responseType: 'json' // <- troca pra JSON, não precisa mais vir como 'blob'
      });
  
      const rawData = response.data;
  
      // Mapeia os dados para colunas com nomes desejados e formata a data
      const exportData = rawData.map(item => ({
        'Instalação': item['Instalação'],
        'Nota': item['Nota'],
        'Cliente': item['Cliente'],
        'Texto breve para o code': item['Texto breve para o code'],
        'Alavanca': item['Alavanca'],
        'Data Conclusão': formatDate(item['Data Conclusão']),
        'Equipamento Removido': item['Equipamento Removido'],
        'Material Removido': item['Material Removido'],
        'Descrição Mat. Removido': item['Descrição Mat. Removido'],
        'Status Equip. Removido': item['Status Equip. Removido'],
        'Equipamento Instalado': item['Equipamento Instalado'],
        'Material Instalado': item['Material Instalado'],
        'Descrição Mat. Instalado': item['Descrição Mat. Instalado'],
        'Status Equip. Instalado': item['Status Equip. Instalado']
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Equipamentos");
  
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
  
      saveAs(blob, 'equipamentos_filtrados.xlsx');
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
    getUltimaData(); // carrega a data máxima ao abrir
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // corrige o offset
      return format(localDate, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Consulta de Equipamentos
      </Typography>

      <Box sx={styles.filterContainer}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <DatePicker
              label="Data Inicial"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => <TextField {...params} size="small" sx={{ width: 180 }} />}
            />
            <DatePicker
              label="Data Final"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => <TextField {...params} size="small" sx={{ width: 180 }} />}
            />
            <TextField
              label="Equip. Removido"
              value={equipamentoFilter}
              onChange={(e) => setEquipamentoFilter(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui"
            />
            <TextField
              label="Nota"
              value={notaFilter}
              onChange={(e) => setNotaFilter(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui"
            />
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                  variant="contained"
                  onClick={() => fetchData(false)}
                  size="medium"
                  sx={{ height: 40, minWidth: 120 }}
                  disabled={loading || !filtrosPreenchidos()}
                >
                  {loading ? <CircularProgress size={24} /> : 'Filtrar'}
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleExport}
                  size="medium"
                  sx={{ height: 40, minWidth: 120 }}
                  disabled={loading || data.length === 0}
                >
                  Exportar Excel
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
        <>
          {(totalCount !== null || ultimaAtualizacao) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {totalCount !== null
                  ? <>Total de registros encontrados: <strong>{totalCount}</strong></>
                  : <span />}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                <>Dados atualizados até: <strong>{ultimaAtualizacao ? formatDate(ultimaAtualizacao) : '--'}</strong></>
              </Typography>
            </Box>
          )}
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
                  <TableCell sx={{ ...styles.tableHeaderCell, borderLeft: '2px solid black' }}>Equip. Removido</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Material Removido</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Descrição Mat. Removido</TableCell>
                  <TableCell sx={{ ...styles.tableHeaderCell, whiteSpace: 'normal', lineHeight: '1.2', py: 1, textAlign: 'left', width: '100px', minWidth: '100px', maxWidth: '100px' }}>Status Equip.<br />Removido</TableCell>
                  <TableCell sx={{ ...styles.tableHeaderCell, borderLeft: '2px solid black' }}>Equip. Instalado</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Material Instalado</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Descrição Mat. Instalado</TableCell>
                  <TableCell sx={{ ...styles.tableHeaderCell, whiteSpace: 'normal', lineHeight: '1.2', py: 1, textAlign: 'left', width: '100px', minWidth: '100px', maxWidth: '100px' }}>Status Equip.<br />Instalado</TableCell>
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
        </>
      )}
    </Container>
  );
}

export default App;