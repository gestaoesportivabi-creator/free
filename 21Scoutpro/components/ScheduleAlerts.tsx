import React, { useState, useEffect, useMemo } from 'react';
import { WeeklySchedule, ScheduleDay } from '../types';
import { normalizeScheduleDays } from '../utils/scheduleUtils';
import { Bell, CheckCircle } from 'lucide-react';

interface ScheduleAlertsProps {
    schedules: WeeklySchedule[];
}

interface AlertItem {
    scheduleTitle: string;
    activity: string;
    location: string;
    time: string;
    date: string;
    notes?: string;
    alertTime: Date; // Hora em que o alerta deve aparecer (12 horas antes)
    eventTime: Date; // Hora do evento
}

export const ScheduleAlerts: React.FC<ScheduleAlertsProps> = ({ schedules }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Atualizar hora atual a cada minuto (e imediatamente ao montar)
    useEffect(() => {
        setCurrentTime(new Date()); // Atualizar imediatamente
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Atualiza a cada minuto

        return () => clearInterval(interval);
    }, []);

    // Buscar compromissos de hoje e gerar alertas
    const alerts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Filtrar apenas schedules ativos e com days válido
        const activeSchedules = schedules.filter(s => {
          const isActive = s.isActive === true || s.isActive === 'TRUE' || s.isActive === 'true';
          return isActive && s.days && Array.isArray(s.days) && s.days.length > 0;
        });
        
        console.log('📅 Schedules ativos encontrados:', activeSchedules.length, activeSchedules.map(s => ({ id: s.id, title: s.title, isActive: s.isActive })));
        const alertsList: AlertItem[] = [];

        activeSchedules.forEach(schedule => {
            if (!schedule.days || !Array.isArray(schedule.days)) return;
            
            schedule.days.forEach(day => {
                // Verificar se é hoje
                if (day.date === todayStr && day.time && day.activity && day.time.trim() !== '') {
                    try {
                        // Parsear hora do compromisso (formato HH:MM)
                        const timeParts = day.time.trim().split(':');
                        if (timeParts.length < 2) return;
                        
                        const hours = parseInt(timeParts[0], 10);
                        const minutes = parseInt(timeParts[1] || '0', 10);
                        
                        if (isNaN(hours) || isNaN(minutes)) return;
                        
                        const eventTime = new Date(today);
                        eventTime.setHours(hours, minutes, 0, 0);

                        // Calcular hora do alerta (3 horas antes)
                        const alertTime = new Date(eventTime);
                        alertTime.setHours(alertTime.getHours() - 3);
                        
                        // Se o alerta ficou no dia anterior, ajustar para 21:00 do dia anterior
                        // Isso permite que eventos às 00:00 mostrem alerta desde 21:00 do dia anterior
                        if (alertTime.getDate() !== eventTime.getDate()) {
                            const previousDay = new Date(eventTime);
                            previousDay.setDate(previousDay.getDate() - 1);
                            previousDay.setHours(21, 0, 0, 0);
                            alertTime.setTime(previousDay.getTime());
                        }

                        alertsList.push({
                            scheduleTitle: schedule.title,
                            activity: day.activity,
                            location: day.location || '',
                            time: day.time,
                            date: day.date,
                            notes: day.notes,
                            alertTime,
                            eventTime
                        });
                    } catch (e) {
                        console.error('Erro ao processar compromisso:', e, day);
                    }
                }
            });
        });

        // Ordenar por horário do evento
        return alertsList.sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
    }, [schedules]);

    // Filtrar alertas ativos (já passou a hora do alerta e ainda não passou a hora do evento)
    const activeAlerts = useMemo(() => {
        const filtered = alerts.filter(alert => {
            const alertKey = `${alert.date}-${alert.time}-${alert.activity}`;
            
            // Se foi dispensado, não mostrar
            if (dismissedAlerts.has(alertKey)) {
                return false;
            }

            // Alertar 3 horas antes - SEMPRE mostrar se já passou a hora do alerta
            const shouldShow = currentTime >= alert.alertTime;
            
            // Não mostrar se já passou a hora do evento
            const hasPassed = currentTime > alert.eventTime;
            
            // Se o evento for hoje e ainda não passou, mostrar sempre (independente da hora)
            const isToday = alert.date === new Date().toISOString().split('T')[0];
            const showToday = isToday && !hasPassed;

            const result = (shouldShow || showToday) && !hasPassed;
            
            return result;
        });
        
        return filtered;
    }, [alerts, currentTime, dismissedAlerts]);

    // Compromissos de hoje (para mensagem positiva)
    const todayEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const activeSchedules = schedules.filter(s => s.isActive && s.days && Array.isArray(s.days));
        const events: ScheduleDay[] = [];

        activeSchedules.forEach(schedule => {
            const flatDays = normalizeScheduleDays(schedule);
            flatDays.forEach(day => {
                if (day.date === todayStr && day.time && day.activity) {
                    events.push(day);
                }
            });
        });

        // Ordenar por horário
        return events.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });
    }, [schedules]);

    const handleDismiss = (alertKey: string) => {
        setDismissedAlerts(prev => new Set(prev).add(alertKey));
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            return `${hours}:${minutes || '00'}`;
        } catch {
            return time;
        }
    };

    // Função para obter cor e emoji baseado no tipo de atividade
    const getActivityStyle = (activity: string) => {
        const activityLower = activity.toLowerCase().trim();
        
        if (activityLower.includes('treino')) {
            return {
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-400',
                textColor: 'text-blue-200',
                textColorSecondary: 'text-blue-300/80',
                emoji: '🎯'
            };
        } else if (activityLower.includes('jogo')) {
            return {
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-400',
                textColor: 'text-green-200',
                textColorSecondary: 'text-green-300/80',
                emoji: '⚽ 🏃'
            };
        } else if (activityLower.includes('viagem')) {
            return {
                bgColor: 'bg-orange-500/20',
                borderColor: 'border-orange-400',
                textColor: 'text-orange-200',
                textColorSecondary: 'text-orange-300/80',
                emoji: '🛣️ 🚌'
            };
        } else if (activityLower.includes('academia') || activityLower.includes('musculação') || activityLower.includes('musculacao')) {
            return {
                bgColor: 'bg-gray-500/20',
                borderColor: 'border-gray-400',
                textColor: 'text-gray-200',
                textColorSecondary: 'text-gray-300/80',
                emoji: '🏋️ 💪'
            };
        } else if (activityLower.includes('folga')) {
            return {
                bgColor: 'bg-yellow-500/20',
                borderColor: 'border-yellow-400',
                textColor: 'text-yellow-200',
                textColorSecondary: 'text-yellow-300/80',
                emoji: '😴 📺'
            };
        } else {
            // Outro
            return {
                bgColor: 'bg-purple-500/20',
                borderColor: 'border-purple-400',
                textColor: 'text-purple-200',
                textColorSecondary: 'text-purple-300/80',
                emoji: '📅'
            };
        }
    };

    if (activeAlerts.length === 0 && todayEvents.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            {/* Alertas Ativos - Compacto em uma linha com formatação condicional */}
            {activeAlerts.length > 0 && (
                <div className="space-y-1.5">
                    {activeAlerts.map((alert, index) => {
                        const alertKey = `${alert.date}-${alert.time}-${alert.activity}`;
                        const hoursUntil = Math.round((alert.eventTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
                        const minutesUntil = Math.round(((alert.eventTime.getTime() - currentTime.getTime()) / (1000 * 60)) % 60);
                        const style = getActivityStyle(alert.activity);
                        
                        return (
                            <div 
                                key={index} 
                                className={`
                                    ${style.bgColor} 
                                    border-l-4 ${style.borderColor} 
                                    rounded-r-lg px-4 py-3 
                                    backdrop-blur-sm
                                    shadow-lg
                                    animate-pulse
                                    transition-all duration-300
                                    hover:shadow-xl
                                `}
                            >
                                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                                    <Bell className={`w-3.5 h-3.5 ${style.textColor} flex-shrink-0 animate-pulse`} />
                                    <span className={`${style.textColor} font-bold`}>
                                        {style.emoji} {alert.activity}
                                    </span>
                                    {alert.location && <span className={`${style.textColorSecondary} text-[10px] font-medium`}>({alert.location})</span>}
                                    <span className={`${style.textColorSecondary} font-semibold`}>{formatTime(alert.time)}</span>
                                    {hoursUntil >= 0 && minutesUntil >= 0 && (
                                        <span className={`${style.textColorSecondary} text-[10px] font-bold`}>
                                            {hoursUntil > 0 ? `${hoursUntil}h` : ''} {minutesUntil > 0 ? `${minutesUntil}min` : 'agora'}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDismiss(alertKey)}
                                        className={`${style.textColorSecondary} hover:opacity-100 hover:text-white transition-colors ml-auto text-base font-bold leading-none`}
                                        title="Dispensar"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mensagem Positiva com Observação - Compacta em uma linha com formatação condicional */}
            {todayEvents.length > 0 && (
                (() => {
                    const firstEvent = todayEvents[0];
                    const style = getActivityStyle(firstEvent.activity);
                    return (
                        <div className={`
                            ${style.bgColor} 
                            border-l-4 ${style.borderColor} 
                            rounded-r-lg px-3 py-2 
                            backdrop-blur-sm
                            shadow-md ${style.borderColor}/20
                            transition-all duration-300
                        `}>
                            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                                <CheckCircle className={`w-3.5 h-3.5 ${style.textColor} flex-shrink-0`} />
                                <span className={`${style.textColor} font-bold`}>
                                    Hoje o compromisso da nossa equipe é <span className="uppercase">{style.emoji} {firstEvent.activity}</span>
                                    {firstEvent.time && ` às ${formatTime(firstEvent.time)}`}
                                    {firstEvent.notes && (
                                        <span className={`${style.textColorSecondary} italic ml-2 font-medium`}>
                                            • {firstEvent.notes}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
};

