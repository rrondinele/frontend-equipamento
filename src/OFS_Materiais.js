import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Box, CircularProgress, Alert, Checkbox, FormControl, FormGroup,
  FormControlLabel, Popover, Chip, Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
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
    minWidth: '1500px',
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
  filterContainer: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  filterButton: {
    minWidth: 200,
    justifyContent: 'flex-start',
    textTransform: 'none',
    borderColor: '#ccc',
    '&:hover': {
      borderColor: '#1976d2',
    },
  },
  filterChip: {
    margin: '0 4px 4px 0',
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
};

function OFS_Materiais() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [equipamentoFilter, setEquipamentoFilter] = useState('');
  const [notaFilter, setNotaFilter] = useState('');
  const [totalCount, setTotalCount] = useState(null);
  
  // Estados para filtro de ação
  const actionOptions = [
    'Todos',
    'Cliente/Levantamento de Carga',
    'Desinstalado',
    'Instalado',
    'Sem aba de equipamentos',
    'Sem registros',
    'Tabela equipamentos vazia'
  ];
  
  const [actionFilters, setActionFilters] = useState({
    'Todos': true,
    'Cliente/Levantamento de Carga': true,
    'Desinstalado': true,
    'Instalado': true,
    'Sem aba de equipamentos': true,
    'Sem registros': true,
    'Tabela equipamentos vazia': true
  });
  
  const [anchorEl, setAnchorEl] = useState(null);

  const filtrosPreenchidos = () => {
    return startDate && endDate || equipamentoFilter.trim() || notaFilter.trim();
  };

  const handleActionFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionFilterClose = () => {
    setAnchorEl(null);
  };

  const handleActionFilterChange = (option) => (event) => {
    if (option === 'Todos') {
      const newState = {};
      actionOptions.forEach(opt => {
        newState[opt] = event.target.checked;
      });
      setActionFilters(newState);
    } else {
      setActionFilters({
        ...actionFilters,
        [option]: event.target.checked,
        'Todos': false, // Desmarca "Todos" quando um status específico é alterado
      });
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'action-filter-popover' : undefined;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!filtrosPreenchidos()) {
        setError('Informe um intervalo de datas, Nota ou Serial para continuar.');
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
      
      // Adiciona filtros de ação se não estiver selecionado "Todos"
      if (!actionFilters['Todos']) {
        const selectedActions = Object.keys(actionFilters)
          .filter(key => actionFilters[key] && key !== 'Todos');
        if (selectedActions.length > 0) {
          params.acoes = selectedActions.join(',');
        }
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
      
      // Aplica filtros de ação para exportação também
      if (!actionFilters['Todos']) {
        const selectedActions = Object.keys(actionFilters)
          .filter(key => actionFilters[key] && key !== 'Todos');
        if (selectedActions.length > 0) {
          params.acoes = selectedActions.join(',');
        }
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

  // Filtra os dados localmente (opcional, pode remover se o backend já filtrar)
  const filteredData = data.filter(row => {
    if (actionFilters['Todos']) return true;
    return actionFilters[row['Acao']];
  });

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
            
            {/* Filtro de Ação */}
            <Button
              variant="outlined"
              onClick={handleActionFilterClick}
              sx={styles.filterButton}
              endIcon={
                <Box component="span" sx={{ 
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}>
                  {actionFilters['Todos'] ? actionOptions.length - 1 : 
                    Object.keys(actionFilters).filter(k => actionFilters[k] && k !== 'Todos').length}
                </Box>
              }
            >
              Ação: {actionFilters['Todos'] ? 'Todos' : 
                Object.keys(actionFilters)
                  .filter(k => actionFilters[k] && k !== 'Todos')
                  .map(k => k.split(' ')[0]) // Mostra apenas a primeira palavra para economizar espaço
                  .join(', ')}
            </Button>
            
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleActionFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <Box sx={{ p: 2, maxWidth: 300 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Filtrar por Status da Ação</Typography>
                <FormControl component="fieldset" fullWidth>
                  <FormGroup>
                    {actionOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={actionFilters[option]}
                            onChange={handleActionFilterChange(option)}
                            name={option}
                            color="primary"
                          />
                        }
                        label={option}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '0.875rem',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          } 
                        }}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Box>
            </Popover>
            
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
            <TextField
              label="Serial"
              value={equipamentoFilter}
              onChange={(e) => setEquipamentoFilter(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              multiline
              rows={1.5}
              placeholder="Cole a lista aqui"
            />
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
              {!actionFilters['Todos'] && (
                <span style={{ marginLeft: '16px' }}>
                  (Filtrados: <strong>
                    {filteredData.length}
                  </strong>)
                </span>
              )}
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
                {filteredData.map((row, index) => (
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