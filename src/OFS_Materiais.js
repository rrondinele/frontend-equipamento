import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Box, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

const API_URL = 'https://backend-equipamento.onrender.com';

const statusOptions = [
  'Todos',
  'Cliente/Levantamento de Carga',
  'Desinstalado',
  'Instalado',
  'Sem aba de equipamentos',
  'Sem registros',
  'Tabela equipamentos vazia'
];

const styles = {
  tableContainer: { width: '100%', overflowX: 'auto', marginTop: '16px', boxShadow: 3 },
  table: { minWidth: '1500px' },
  tableHeaderCell: {
    backgroundColor: '#1976d2', color: 'white', fontWeight: '500',
    fontSize: '0.875rem', padding: '12px 16px', borderBottom: 'none', whiteSpace: 'nowrap'
  },
  tableCell: { padding: '10px 16px', whiteSpace: 'nowrap', fontSize: '0.8rem' },
  filterContainer: { backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }
};

function OFS_Materiais() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [equipamentoFilter, setEquipamentoFilter] = useState('');
  const [notaFilter, setNotaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(['Todos']);
  const [totalCount, setTotalCount] = useState(null);



  const getStatusLabel = () => {
    if (statusFilter.includes('Todos')) return 'Todos';
    return `${statusFilter.length} selecionado${statusFilter.length > 1 ? 's' : ''}`;
  };

  const getStatusCount = () => {
    return statusFilter.includes('Todos') ? statusOptions.length - 1 : statusFilter.length;
  };


  const filtrosPreenchidos = () => {
    return startDate && endDate || equipamentoFilter.trim() || notaFilter.trim() || statusFilter.length > 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return format(localDate, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const getStatusParam = () => {
    if (statusFilter.includes('Todos')) return '';
    return statusFilter.join(',');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!filtrosPreenchidos()) {
        setError('Informe um intervalo de datas, Nota ou Descrição para continuar.');
        setLoading(false);
        return;
      }

      const params = {};
      if (startDate && endDate) {
        params.dataInicial = format(startDate, 'yyyy-MM-dd');
        params.dataFinal = format(endDate, 'yyyy-MM-dd');
      }
      if (notaFilter) {
        params.nota = notaFilter.split(/[\n,\s]+/).filter(e => e).join(',');
      }
      if (equipamentoFilter) {
        params.equipamento = equipamentoFilter.split(/[\n,\s]+/).filter(e => e).join(',');
      }
      const statusParam = getStatusParam();
      if (statusParam) {
        params.status = statusParam;
      }

      const response = await axios.get(`${API_URL}/api/materiais`, { params });
      setData(response.data);

      const countRes = await axios.get(`${API_URL}/api/materiais/count`, { params });
      setTotalCount(countRes.data.count);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (startDate && endDate) {
        params.dataInicial = format(startDate, 'yyyy-MM-dd');
        params.dataFinal = format(endDate, 'yyyy-MM-dd');
      }
      if (notaFilter) {
        params.nota = notaFilter.split(/[\n,\s]+/).filter(e => e).join(',');
      }
      if (equipamentoFilter) {
        params.equipamento = equipamentoFilter.split(/[\n,\s]+/).filter(e => e).join(',');
      }
      const statusParam = getStatusParam();
      if (statusParam) {
        params.status = statusParam;
      }

      const response = await axios.get(`${API_URL}/api/materiais/export`, {
        params,
        responseType: 'json'
      });

      const exportData = response.data.map(item => ({
        'Data': formatDate(item['Data']),
        'Nota': item['Nota'],
        'Texto': item['Texto Breve'],
        'Acao': item['Acao'],
        'Status do Usuário': item['Status do Usuário'],
        'Tipo de nota': item['Tipo de nota'],
        'Instalação': item['Instalação'],
        'Zona': item['Zona'],
        'Lote': item['Lote'],
        'Descricao': item['Descricao'],
        'Quantidade': item['Quantidade'],
        'Serial': item['Serial'],
        'Base Operacional': item['Base Operacional']
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Materiais');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'materiais_filtrados.xlsx');
    } catch (err) {
      setError('Erro ao exportar Excel');
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: 4 }}>
      <Typography variant="h4" gutterBottom>
        Consulta de Materiais (OFS)
      </Typography>

      <Box sx={styles.filterContainer}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
              label="Nota"
              value={notaFilter}
              onChange={(e) => setNotaFilter(e.target.value)}
              size="small"
              sx={{ width: 200 }}
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui"
            />
            <TextField
              label="Serial"
              value={equipamentoFilter}
              onChange={(e) => setEquipamentoFilter(e.target.value)}
              size="small"
              sx={{ width: 200 }}
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui"
            />
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes('Todos')) {
                    setStatusFilter(['Todos']);
                  } else {
                    setStatusFilter(value.filter(v => v !== 'Todos'));
                  }
                }}
                input={<OutlinedInput label="Status" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selected.includes('Todos')
                      ? 'Todos'
                      : `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`}
                    <Box
                      component="span"
                      sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {selected.includes('Todos') ? statusOptions.length - 1 : selected.length}
                    </Box>
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                    },
                  },
                }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    <Checkbox checked={statusFilter.includes(status)} />
                    <ListItemText primary={status} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="contained" onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Filtrar'}
              </Button>
              <Button variant="outlined" color="success" onClick={handleExport} disabled={loading || !data.length}>
                Exportar Excel
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {totalCount !== null && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Total de registros encontrados: <strong>{totalCount}</strong>
            </Typography>
          )}
          <TableContainer component={Paper} sx={styles.tableContainer}>
            <Table sx={styles.table}>
              <TableHead>
                <TableRow>
                  <TableCell sx={styles.tableHeaderCell}>Data</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Nota</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Texto Breve</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Ação</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Status do Usuário</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Tipo de nota</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Instalação</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Zona</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Lote</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Descrição</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Quantidade</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Serial</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Base Operacional</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={styles.tableCell}>{formatDate(row['Data'])}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Nota']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Texto Breve']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Acao']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Status do Usuário']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Tipo de nota']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Instalação']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Zona']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Lote']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Descricao']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Quantidade']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Serial']}</TableCell>
                    <TableCell sx={styles.tableCell}>{row['Base Operacional']}</TableCell>
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

export default OFS_Materiais;
