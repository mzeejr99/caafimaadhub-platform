import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, GraduationCap, Award, Clock, Loader2, CheckCircle2, PlayCircle, FileText } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { enumLabel } from '../../i18n/enums';
import api from '../../services/api';

export default function MyTrainingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/training');
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-sky-600 dark:text-sky-400" /> {t('nav.my_training')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('my_training.subtitle')}
        </p>
      </div>

      {courses.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center w-full">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.no_data')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        {courses.map((course) => {
          const progress = course.enrollment ? course.enrollment.progress_percentage || 0 : 0;
          const isCompleted = !!course.certificate || progress >= 100;
          const started = progress > 0;
          const estimatedHours = Number(course.estimated_hours || 0);
          const durationLabel = estimatedHours
            ? (estimatedHours < 1 ? `${Math.round(estimatedHours * 60)} ${t('common.minutes')}` : `${estimatedHours} ${t('common.hours')}`)
            : '—';

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="sky">{enumLabel(t, course.category)}</Badge>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {durationLabel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{course.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{course.description}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {course.total_lessons || 0} {t('training.lessons')}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {course.total_quizzes ? t('my_training.one_assessment') : t('my_training.no_assessment')}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('my_training.completed')}
                    </span>
                  )}
                </div>

                {started && !isCompleted && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{progress}%</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('training.passing_score')}: <strong className="text-slate-800 dark:text-slate-200">{course.passing_score_percentage || 80}%</strong>
                </div>
                <div className="flex items-center gap-2">
                  {course.certificate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/volunteer/certificates')}
                      icon={Award}
                    >
                      {t('training.view_certificate')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => navigate(`/volunteer/training/${course.id}`)}
                    icon={GraduationCap}
                  >
                    {started ? t('training.continue_course') : t('training.start_course')}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
