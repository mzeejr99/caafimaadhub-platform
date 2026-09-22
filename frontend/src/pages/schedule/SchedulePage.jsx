import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, MapPin, Users,
  CalendarCheck2, CalendarX2, Megaphone, CircleDot
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  so: ['Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun', 'Luuliyo', 'Agoosto', 'Sebtembar', 'Oktoobar', 'Nofembar', 'Desembar']
};

const WEEKDAYS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  so: ['Isn', 'Tal', 'Arb', 'Kha', 'Jim', 'Sab', 'Axa']
};

/** Local YYYY-MM-DD key (never uses toISOString, which shifts by timezone). */
function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses 'YYYY-MM-DD HH:MM:SS' (MySQL dateStrings) and ISO strings alike. */
function parseDbDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = String(value).replace(' ', 'T');
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function SchedulePage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const canFilterVolunteers = isAdmin || isSuperAdmin;

  const [schedules, setSchedules] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerFilter, setVolunteerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [autoJumped, setAutoJumped] = useState(false);

  const months = MONTHS[language] || MONTHS.en;
  const weekdays = WEEKDAYS[language] || WEEKDAYS.en;

  useEffect(() => {
    if (canFilterVolunteers) fetchVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFilterVolunteers]);

  useEffect(() => {
    fetchSchedules(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volunteerFilter]);

  const fetchVolunteers = async () => {
    try {
      const res = await api.get('/volunteers', { limit: 100 });
      if (res.success) setVolunteers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/tasks/schedules', {
        volunteerId: volunteerFilter || undefined
      });
      if (res.success) {
        const rows = (res.data || []).map((row) => ({
          ...row,
          start: parseDbDate(row.start_time),
          end: parseDbDate(row.end_time)
        })).filter(r => r.start);
        setSchedules(rows);

        // If the current month holds nothing, open the month of the next shift instead
        if (!autoJumped && rows.length > 0) {
          const currentMonthHas = rows.some(
            r => r.start.getFullYear() === cursor.getFullYear() && r.start.getMonth() === cursor.getMonth()
          );
          if (!currentMonthHas) {
            const now = new Date();
            const upcoming = rows.filter(r => r.start >= now).sort((a, b) => a.start - b.start)[0];
            const target = upcoming || rows.slice().sort((a, b) => b.start - a.start)[0];
            setCursor(new Date(target.start.getFullYear(), target.start.getMonth(), 1));
            setSelectedDay(dayKey(target.start));
          }
          setAutoJumped(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useAutoRefresh(fetchSchedules, 15000);

  const byDay = useMemo(() => {
    const map = {};
    for (const s of schedules) {
      // A shift may span several days (e.g. an unavailability block)
      const last = s.end && s.end > s.start ? s.end : s.start;
      const walker = new Date(s.start.getFullYear(), s.start.getMonth(), s.start.getDate());
      const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      let guard = 0;
      while (walker <= lastDay && guard < 60) {
        const key = dayKey(walker);
        (map[key] = map[key] || []).push(s);
        walker.setDate(walker.getDate() + 1);
        guard++;
      }
    }
    return map;
  }, [schedules]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Monday-first offset
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return {
        date,
        key: dayKey(date),
        inMonth: date.getMonth() === month
      };
    });
  }, [cursor]);

  const todayKey = dayKey(new Date());
  const selectedEntries = byDay[selectedDay] || [];

  // Shows what is still ahead; when a programme has already finished, the most
  // recent shifts are listed instead so the panel is never blank.
  const { sidePanelTitle, sidePanelEntries } = useMemo(() => {
    const now = new Date();
    const future = schedules
      .filter(s => (s.end || s.start) >= now)
      .sort((a, b) => a.start - b.start);

    if (future.length > 0) {
      return { sidePanelTitle: t('schedule.upcoming', 'Upcoming'), sidePanelEntries: future.slice(0, 6) };
    }

    const past = schedules.slice().sort((a, b) => b.start - a.start).slice(0, 6);
    return { sidePanelTitle: t('schedule.recent', 'Most recent'), sidePanelEntries: past };
  }, [schedules, t]);

  const monthCount = grid.filter(c => c.inMonth).reduce((sum, c) => sum + (byDay[c.key] ? byDay[c.key].length : 0), 0);

  const goMonth = (delta) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(dayKey(now));
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            {canFilterVolunteers ? t('nav.schedules') : t('nav.my_schedule')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {canFilterVolunteers
              ? t('schedule.subtitle_admin')
              : t('schedule.subtitle_volunteer')}
          </p>
        </div>

        {canFilterVolunteers && (
          <select
            value={volunteerFilter}
            onChange={(e) => setVolunteerFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="" className="dark:bg-slate-800">{t('common.all')} — {t('nav.volunteers')}</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id} className="dark:bg-slate-800">
                {v.full_name || v.volunteer_id}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {months[cursor.getMonth()]} {cursor.getFullYear()}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {monthCount} {monthCount === 1 ? t('schedule.entry') : t('schedule.entries')} {t('schedule.this_month')}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => goMonth(-1)} icon={ChevronLeft} />
                <Button variant="outline" size="sm" onClick={goToday}>{t('schedule.today')}</Button>
                <Button variant="outline" size="sm" onClick={() => goMonth(1)} icon={ChevronRight} />
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80">
              {weekdays.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((cell) => {
                const entries = byDay[cell.key] || [];
                const isSelected = cell.key === selectedDay;
                const isToday = cell.key === todayKey;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDay(cell.key)}
                    className={`min-h-[84px] border-b border-r border-slate-100 dark:border-slate-800/80 p-1.5 text-left align-top transition-colors ${
                      cell.inMonth
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'bg-slate-50/50 dark:bg-slate-950/40'
                    } ${isSelected ? 'ring-2 ring-inset ring-teal-500' : ''}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold mb-1 ${
                        isToday
                          ? 'bg-teal-600 text-white'
                          : cell.inMonth
                            ? 'text-slate-700 dark:text-slate-200'
                            : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    <span className="block space-y-1">
                      {entries.slice(0, 2).map((entry) => (
                        <span
                          key={`${cell.key}-${entry.id}`}
                          className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            entry.is_available
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60'
                          }`}
                          title={entry.title}
                        >
                          {entry.title}
                        </span>
                      ))}
                      {entries.length > 2 && (
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1.5">
                          +{entries.length - 2} {t('schedule.more')}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3 flex items-center gap-5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <CircleDot className="w-3 h-3 text-teal-600 dark:text-teal-400" /> {t('schedule.duty_shift')}
              </span>
              <span className="flex items-center gap-1.5">
                <CircleDot className="w-3 h-3 text-amber-500 dark:text-amber-400" /> {t('schedule.unavailable')}
              </span>
            </div>
          </div>

          {/* Day detail + upcoming */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{selectedDay}</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedEntries.length} {selectedEntries.length === 1 ? t('schedule.entry') : t('schedule.entries')}
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto">
                {selectedEntries.length === 0 && (
                  <p className="px-5 py-6 text-xs text-slate-500 dark:text-slate-400 text-center">{t('common.no_data')}</p>
                )}
                {selectedEntries.map((entry) => (
                  <div key={entry.id} className="px-5 py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{entry.title}</p>
                      <Badge variant={entry.is_available ? 'warning' : 'teal'}>
                        {entry.is_available ? t('schedule.unavailable') : t('schedule.duty')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {entry.is_available
                        ? <CalendarX2 className="w-3.5 h-3.5" />
                        : <CalendarCheck2 className="w-3.5 h-3.5" />}
                      {formatTime(entry.start)} – {formatTime(entry.end)}
                    </p>
                    {entry.volunteer_name && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {entry.volunteer_name}
                      </p>
                    )}
                    {entry.campaign_name && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5" /> {entry.campaign_name}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700/50 rounded-lg p-2.5">
                        {entry.notes}
                      </p>
                    )}
                    {entry.task_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={MapPin}
                        onClick={() => navigate(canFilterVolunteers ? '/admin/tasks' : '/volunteer/tasks')}
                      >
                        {t('common.view')} {t('nav.tasks')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{sidePanelTitle}</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sidePanelEntries.length === 0 && (
                  <p className="px-5 py-6 text-xs text-slate-500 dark:text-slate-400 text-center">{t('common.no_data')}</p>
                )}
                {sidePanelEntries.map((entry) => (
                  <button
                    key={`up-${entry.id}`}
                    type="button"
                    onClick={() => {
                      setCursor(new Date(entry.start.getFullYear(), entry.start.getMonth(), 1));
                      setSelectedDay(dayKey(entry.start));
                    }}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {dayKey(entry.start)} · {formatTime(entry.start)}
                      {entry.volunteer_name ? ` · ${entry.volunteer_name}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
