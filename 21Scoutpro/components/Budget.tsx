import React, { useState, useMemo } from 'react';
import { BudgetEntry, BudgetExpense, BudgetEntryType, BudgetExpenseType, PaymentStatus, BudgetCategory } from '../types';
import { DollarSign, Plus, Save, X, Calendar, TrendingUp, TrendingDown, Edit2, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { ExpandableCard } from './ExpandableCard';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BudgetProps {
    entries: BudgetEntry[];
    expenses: BudgetExpense[];
    onAddEntry: (entry: BudgetEntry) => void;
    onUpdateEntry: (entry: BudgetEntry) => void;
    onDeleteEntry: (id: string) => void;
    onAddExpense: (expense: BudgetExpense) => void;
    onUpdateExpense: (expense: BudgetExpense) => void;
    onDeleteExpense: (id: string) => void;
}

export const Budget: React.FC<BudgetProps> = ({
    entries,
    expenses,
    onAddEntry,
    onUpdateEntry,
    onDeleteEntry,
    onAddExpense,
    onUpdateExpense,
    onDeleteExpense,
}) => {
    const [monthFilter, setMonthFilter] = useState<string>('Todos');
    
    // Entry Form State
    const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [entryType, setEntryType] = useState<BudgetEntryType>('Patrocínios');
    const [entryExpectedDate, setEntryExpectedDate] = useState('');
    const [entryValue, setEntryValue] = useState('');
    const [entryStatus, setEntryStatus] = useState<PaymentStatus>('Pendente');
    const [entryReceivedDate, setEntryReceivedDate] = useState('');
    const [entryCategory, setEntryCategory] = useState<BudgetCategory>('Variável');
    const [entryStartDate, setEntryStartDate] = useState('');
    const [entryEndDate, setEntryEndDate] = useState('');

    // Expense Form State
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [expenseType, setExpenseType] = useState<BudgetExpenseType>('Salários Jogadores');
    const [expenseDate, setExpenseDate] = useState('');
    const [expenseValue, setExpenseValue] = useState('');
    const [expenseStatus, setExpenseStatus] = useState<PaymentStatus>('Pendente');
    const [expensePaidDate, setExpensePaidDate] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<BudgetCategory>('Variável');
    const [expenseStartDate, setExpenseStartDate] = useState('');
    const [expenseEndDate, setExpenseEndDate] = useState('');

    const MONTHS = [
        { value: 'Todos', label: 'Todos os Meses' },
        { value: '0', label: 'Janeiro' },
        { value: '1', label: 'Fevereiro' },
        { value: '2', label: 'Março' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Maio' },
        { value: '5', label: 'Junho' },
        { value: '6', label: 'Julho' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Setembro' },
        { value: '9', label: 'Outubro' },
        { value: '10', label: 'Novembro' },
        { value: '11', label: 'Dezembro' },
    ];

    const ENTRY_TYPES: BudgetEntryType[] = [
        'Patrocínios Masters',
        'Patrocínios',
        'Apoiadores',
        'Recursos Municipal',
        'Recursos Estaduais',
        'Recursos Federais',
        'Bilheteria',
        'Outros',
    ];

    const EXPENSE_TYPES: BudgetExpenseType[] = [
        'Salários Jogadores',
        'Salários Comissão Técnica',
        'Alimentação Diária',
        'Alimentação Viagens',
        'Transporte',
        'Hotel',
        'Arbitragem',
        'Materiais',
        'Uniformes',
        'Moradia',
        'Água',
        'Luz',
        'Outros',
    ];

    const filteredEntries = useMemo(() => {
        if (monthFilter === 'Todos') return entries;
        return entries.filter(e => {
            const date = new Date(e.expectedDate);
            return date.getMonth().toString() === monthFilter;
        });
    }, [entries, monthFilter]);

    const filteredExpenses = useMemo(() => {
        if (monthFilter === 'Todos') return expenses;
        return expenses.filter(e => {
            const date = new Date(e.date);
            return date.getMonth().toString() === monthFilter;
        });
    }, [expenses, monthFilter]);

    const totalEntries = useMemo(() => {
        return filteredEntries.reduce((sum, e) => sum + e.value, 0);
    }, [filteredEntries]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.value, 0);
    }, [filteredExpenses]);

    const receivedEntries = useMemo(() => {
        return filteredEntries
            .filter(e => e.status === 'Recebido')
            .reduce((sum, e) => sum + e.value, 0);
    }, [filteredEntries]);

    const paidExpenses = useMemo(() => {
        return filteredExpenses
            .filter(e => e.status === 'Pago')
            .reduce((sum, e) => sum + e.value, 0);
    }, [filteredExpenses]);

    const balance = receivedEntries - paidExpenses;
    const projectedBalance = totalEntries - totalExpenses;

    // Dados para gráficos
    const pieChartData = useMemo(() => [
        { name: 'Entradas', value: receivedEntries, fill: '#10b981' },
        { name: 'Saídas', value: paidExpenses, fill: '#ef4444' },
    ], [receivedEntries, paidExpenses]);

    const entriesByType = useMemo(() => {
        const grouped: Record<string, number> = {};
        filteredEntries.forEach(e => {
            grouped[e.type] = (grouped[e.type] || 0) + e.value;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [filteredEntries]);

    const expensesByType = useMemo(() => {
        const grouped: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            grouped[e.type] = (grouped[e.type] || 0) + e.value;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);

    const fixedVsVariableExpenses = useMemo(() => {
        const fixed = filteredExpenses
            .filter(e => e.category === 'Fixo')
            .reduce((sum, e) => sum + e.value, 0);
        const variable = filteredExpenses
            .filter(e => e.category === 'Variável')
            .reduce((sum, e) => sum + e.value, 0);
        return [
            { name: 'Fixo', value: fixed, fill: '#6366f1' },
            { name: 'Variável', value: variable, fill: '#f59e0b' },
        ];
    }, [filteredExpenses]);

    const fixedVsVariableEntries = useMemo(() => {
        const fixed = filteredEntries
            .filter(e => e.category === 'Fixo')
            .reduce((sum, e) => sum + e.value, 0);
        const variable = filteredEntries
            .filter(e => e.category === 'Variável')
            .reduce((sum, e) => sum + e.value, 0);
        return [
            { name: 'Fixo', value: fixed, fill: '#6366f1' },
            { name: 'Variável', value: variable, fill: '#f59e0b' },
        ];
    }, [filteredEntries]);

    // Salários dos atletas (despesas do tipo "Salários Jogadores")
    const playersSalaryExpenses = useMemo(() => {
        return filteredExpenses
            .filter(e => e.type === 'Salários Jogadores')
            .reduce((sum, e) => sum + e.value, 0);
    }, [filteredExpenses]);

    const salaryPercentage = useMemo(() => {
        if (receivedEntries === 0) return 0;
        return (playersSalaryExpenses / receivedEntries) * 100;
    }, [playersSalaryExpenses, receivedEntries]);

    const handleOpenEntryForm = (entry?: BudgetEntry) => {
        if (entry) {
            setEditingEntryId(entry.id);
            setEntryType(entry.type);
            setEntryExpectedDate(entry.expectedDate);
            setEntryValue(entry.value.toString());
            setEntryStatus(entry.status);
            setEntryReceivedDate(entry.receivedDate || '');
            setEntryCategory(entry.category || 'Variável');
            setEntryStartDate(entry.startDate || '');
            setEntryEndDate(entry.endDate || '');
        } else {
            setEditingEntryId(null);
            setEntryType('Patrocínios');
            setEntryExpectedDate('');
            setEntryValue('');
            setEntryStatus('Pendente');
            setEntryReceivedDate('');
            setEntryCategory('Variável');
            setEntryStartDate('');
            setEntryEndDate('');
        }
        setIsEntryFormOpen(true);
    };

    const handleOpenExpenseForm = (expense?: BudgetExpense) => {
        if (expense) {
            setEditingExpenseId(expense.id);
            setExpenseType(expense.type);
            setExpenseDate(expense.date);
            setExpenseValue(expense.value.toString());
            setExpenseStatus(expense.status);
            setExpensePaidDate(expense.paidDate || '');
            setExpenseCategory(expense.category || 'Variável');
            setExpenseStartDate(expense.startDate || '');
            setExpenseEndDate(expense.endDate || '');
        } else {
            setEditingExpenseId(null);
            setExpenseType('Salários Jogadores');
            setExpenseDate('');
            setExpenseValue('');
            setExpenseStatus('Pendente');
            setExpensePaidDate('');
            setExpenseCategory('Variável');
            setExpenseStartDate('');
            setExpenseEndDate('');
        }
        setIsExpenseFormOpen(true);
    };

    const handleSaveEntry = () => {
        if (!entryExpectedDate || !entryValue || parseFloat(entryValue) <= 0) {
            alert('Preencha todos os campos obrigatórios corretamente.');
            return;
        }

        const entry: BudgetEntry = {
            id: editingEntryId || `entry-${Date.now()}`,
            type: entryType,
            expectedDate: entryExpectedDate,
            value: parseFloat(entryValue),
            status: entryStatus,
            receivedDate: entryStatus === 'Recebido' ? (entryReceivedDate || entryExpectedDate) : undefined,
            category: entryCategory,
            startDate: entryStartDate || undefined,
            endDate: entryEndDate || undefined,
        };

        if (editingEntryId) {
            onUpdateEntry(entry);
        } else {
            onAddEntry(entry);
        }

        setIsEntryFormOpen(false);
        resetEntryForm();
    };

    const handleSaveExpense = () => {
        if (!expenseDate || !expenseValue || parseFloat(expenseValue) <= 0) {
            alert('Preencha todos os campos obrigatórios corretamente.');
            return;
        }

        const expense: BudgetExpense = {
            id: editingExpenseId || `expense-${Date.now()}`,
            type: expenseType,
            date: expenseDate,
            value: parseFloat(expenseValue),
            status: expenseStatus,
            paidDate: expenseStatus === 'Pago' ? (expensePaidDate || expenseDate) : undefined,
            category: expenseCategory,
            startDate: expenseStartDate || undefined,
            endDate: expenseEndDate || undefined,
        };

        if (editingExpenseId) {
            onUpdateExpense(expense);
        } else {
            onAddExpense(expense);
        }

        setIsExpenseFormOpen(false);
        resetExpenseForm();
    };

    const resetEntryForm = () => {
        setEditingEntryId(null);
        setEntryType('Patrocínios');
        setEntryExpectedDate('');
        setEntryValue('');
        setEntryStatus('Pendente');
        setEntryReceivedDate('');
    };

    const resetExpenseForm = () => {
        setEditingExpenseId(null);
        setExpenseType('Salários Jogadores');
        setExpenseDate('');
        setExpenseValue('');
        setExpenseStatus('Pendente');
        setExpensePaidDate('');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black p-6 rounded-3xl shadow-lg border border-zinc-800 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 italic uppercase tracking-tighter">
                        <DollarSign className="text-[#10b981]" />
                        Orçamento
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Controle financeiro da equipe</p>
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-3">
                    <Calendar className="text-zinc-500" size={20} />
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Receitas Previstas</span>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <p className="text-2xl font-black text-white">{formatCurrency(totalEntries)}</p>
                </div>

                <div className="bg-black border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Receitas Recebidas</span>
                        <TrendingUp className="text-green-400" size={20} />
                    </div>
                    <p className="text-2xl font-black text-green-400">{formatCurrency(receivedEntries)}</p>
                </div>

                <div className="bg-black border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Despesas Totais</span>
                        <TrendingDown className="text-red-500" size={20} />
                    </div>
                    <p className="text-2xl font-black text-red-500">{formatCurrency(totalExpenses)}</p>
                </div>

                <div className="bg-black border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Saldo Real</span>
                        <DollarSign className={balance >= 0 ? 'text-green-400' : 'text-red-500'} size={20} />
                    </div>
                    <p className={`text-2xl font-black ${balance >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* Cards Adicionais */}
            {receivedEntries > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Salários dos Atletas</span>
                            <TrendingDown className="text-yellow-500" size={20} />
                        </div>
                        <p className="text-2xl font-black text-yellow-400">{formatCurrency(playersSalaryExpenses)}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                            {salaryPercentage.toFixed(1)}% das receitas recebidas
                        </p>
                    </div>
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Rosca - Entradas vs Saídas */}
                <ExpandableCard title="Entradas vs Saídas" icon={PieChartIcon} headerColor="text-[#10b981]">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ExpandableCard>

                {/* Gráfico Fixo vs Variável - Despesas */}
                <ExpandableCard title="Despesas: Fixo vs Variável" icon={PieChartIcon} headerColor="text-red-400">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={fixedVsVariableExpenses}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {fixedVsVariableExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ExpandableCard>
            </div>

            {/* Gráficos de Coluna */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Coluna - Receitas por Tipo */}
                {entriesByType.length > 0 && (
                    <ExpandableCard title="Receitas por Tipo" icon={TrendingUp} headerColor="text-green-400">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={entriesByType} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis type="number" stroke="#71717a" />
                                    <YAxis dataKey="name" type="category" stroke="#71717a" width={70} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ExpandableCard>
                )}

                {/* Gráfico de Coluna - Despesas por Tipo */}
                {expensesByType.length > 0 && (
                    <ExpandableCard title="Despesas por Tipo" icon={TrendingDown} headerColor="text-red-400">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expensesByType} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis type="number" stroke="#71717a" />
                                    <YAxis dataKey="name" type="category" stroke="#71717a" width={70} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ExpandableCard>
                )}
            </div>

            {/* Gráfico Fixo vs Variável - Receitas */}
            <ExpandableCard title="Receitas: Fixo vs Variável" icon={PieChartIcon} headerColor="text-green-400">
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={fixedVsVariableEntries}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {fixedVsVariableEntries.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </ExpandableCard>

            {/* Entries Section */}
            <ExpandableCard title="Receitas" icon={TrendingUp} headerColor="text-green-400">
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => handleOpenEntryForm()}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        <Plus size={18} />
                        Nova Receita
                    </button>
                </div>

                <div className="space-y-2">
                    {filteredEntries.length === 0 ? (
                        <p className="text-zinc-500 text-sm font-medium text-center py-8">Nenhuma receita cadastrada</p>
                    ) : (
                        filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between hover:border-green-500/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-white font-black text-sm">{entry.type}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                                entry.status === 'Recebido'
                                                    ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                                                    : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/50'
                                            }`}
                                        >
                                            {entry.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-zinc-400 text-xs font-medium">
                                        <span>Previsão: {formatDate(entry.expectedDate)}</span>
                                        {entry.receivedDate && <span>Recebido: {formatDate(entry.receivedDate)}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-green-400 font-black text-lg">{formatCurrency(entry.value)}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenEntryForm(entry)}
                                            className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-blue-400 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Deseja realmente excluir esta receita?')) {
                                                    onDeleteEntry(entry.id);
                                                }
                                            }}
                                            className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ExpandableCard>

            {/* Expenses Section */}
            <ExpandableCard title="Despesas" icon={TrendingDown} headerColor="text-red-400">
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => handleOpenExpenseForm()}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        <Plus size={18} />
                        Nova Despesa
                    </button>
                </div>

                <div className="space-y-2">
                    {filteredExpenses.length === 0 ? (
                        <p className="text-zinc-500 text-sm font-medium text-center py-8">Nenhuma despesa cadastrada</p>
                    ) : (
                        filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between hover:border-red-500/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-white font-black text-sm">{expense.type}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                                expense.status === 'Pago'
                                                    ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                                                    : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/50'
                                            }`}
                                        >
                                            {expense.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-zinc-400 text-xs font-medium">
                                        <span>Data: {formatDate(expense.date)}</span>
                                        {expense.paidDate && <span>Pago: {formatDate(expense.paidDate)}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-red-400 font-black text-lg">{formatCurrency(expense.value)}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenExpenseForm(expense)}
                                            className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-blue-400 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Deseja realmente excluir esta despesa?')) {
                                                    onDeleteExpense(expense.id);
                                                }
                                            }}
                                            className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ExpandableCard>

            {/* Entry Form Modal */}
            {isEntryFormOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white uppercase">
                                {editingEntryId ? 'Editar Receita' : 'Nova Receita'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsEntryFormOpen(false);
                                    resetEntryForm();
                                }}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Tipo de Receita
                                </label>
                                <select
                                    value={entryType}
                                    onChange={(e) => setEntryType(e.target.value as BudgetEntryType)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    {ENTRY_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data Prevista de Entrada *
                                </label>
                                <input
                                    type="date"
                                    value={entryExpectedDate}
                                    onChange={(e) => setEntryExpectedDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Valor (R$) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={entryValue}
                                    onChange={(e) => setEntryValue(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Status *
                                </label>
                                <select
                                    value={entryStatus}
                                    onChange={(e) => {
                                        setEntryStatus(e.target.value as PaymentStatus);
                                        if (e.target.value === 'Recebido' && !entryReceivedDate) {
                                            setEntryReceivedDate(entryExpectedDate || new Date().toISOString().split('T')[0]);
                                        }
                                    }}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Recebido">Recebido</option>
                                </select>
                            </div>

                            {entryStatus === 'Recebido' && (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Data de Recebimento
                                    </label>
                                    <input
                                        type="date"
                                        value={entryReceivedDate}
                                        onChange={(e) => setEntryReceivedDate(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Classificação
                                </label>
                                <select
                                    value={entryCategory}
                                    onChange={(e) => setEntryCategory(e.target.value as BudgetCategory)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    <option value="Fixo">Fixo</option>
                                    <option value="Variável">Variável</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={entryStartDate}
                                    onChange={(e) => setEntryStartDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={entryEndDate}
                                    onChange={(e) => setEntryEndDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveEntry}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEntryFormOpen(false);
                                        resetEntryForm();
                                    }}
                                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Form Modal */}
            {isExpenseFormOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white uppercase">
                                {editingExpenseId ? 'Editar Despesa' : 'Nova Despesa'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsExpenseFormOpen(false);
                                    resetExpenseForm();
                                }}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Tipo de Despesa
                                </label>
                                <select
                                    value={expenseType}
                                    onChange={(e) => setExpenseType(e.target.value as BudgetExpenseType)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    {EXPENSE_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data da Despesa *
                                </label>
                                <input
                                    type="date"
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Valor (R$) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={expenseValue}
                                    onChange={(e) => setExpenseValue(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Status *
                                </label>
                                <select
                                    value={expenseStatus}
                                    onChange={(e) => {
                                        setExpenseStatus(e.target.value as PaymentStatus);
                                        if (e.target.value === 'Pago' && !expensePaidDate) {
                                            setExpensePaidDate(expenseDate || new Date().toISOString().split('T')[0]);
                                        }
                                    }}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                </select>
                            </div>

                            {expenseStatus === 'Pago' && (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Data de Pagamento
                                    </label>
                                    <input
                                        type="date"
                                        value={expensePaidDate}
                                        onChange={(e) => setExpensePaidDate(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Classificação
                                </label>
                                <select
                                    value={expenseCategory}
                                    onChange={(e) => setExpenseCategory(e.target.value as BudgetCategory)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                >
                                    <option value="Fixo">Fixo</option>
                                    <option value="Variável">Variável</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={expenseStartDate}
                                    onChange={(e) => setExpenseStartDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={expenseEndDate}
                                    onChange={(e) => setExpenseEndDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-[#10b981]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveExpense}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsExpenseFormOpen(false);
                                        resetExpenseForm();
                                    }}
                                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
