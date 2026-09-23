import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  ArrowLeft, ArrowRight, BookOpen, PlayCircle, FileText, Image as ImageIcon,
  CheckCircle2, Clock, GraduationCap, Loader2, Download, Award
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { enumLabel } from '../../i18n/enums';
import api from '../../services/api';

/** Minimal renderer for the light markdown used in lesson bodies. */
function LessonBody({ text }) {
  if (!text) return null;

  const inline = (line) =>
    line
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      );

  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1.5 my-3 text-slate-700 dark:text-slate-200">
          {list.map((item, i) => (
            <li key={i} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{inline(item)}</li>
          ))}
        </ul>
      );
      list = null;
    }
  };

  text.split('\n').forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    if (/^\s*[-*]\s+/.test(line)) {
      list = list || [];
      list.push(line.replace(/^\s*[-*]\s+/, ''));
      return;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      list = list || [];
      list.push(line.replace(/^\s*\d+\.\s+/, ''));
      return;
    }

    flushList();

    if (!line.trim()) return;

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={idx} className="text-base font-extrabold text-slate-900 dark:text-white mt-5 mb-2">{line.slice(4)}</h3>
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={idx} className="text-lg font-extrabold text-slate-900 dark:text-white mt-5 mb-2">{line.slice(3)}</h2>
      );
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={idx} className="border-l-4 border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 px-4 py-2.5 my-3 rounded-r-lg">
          <p className="text-xs text-teal-950 dark:text-teal-200 leading-relaxed font-medium">{inline(line.slice(2))}</p>
        </blockquote>
      );
    } else {
      blocks.push(
        <p key={idx} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-2.5">{inline(line)}</p>
      );
    }
  });

  flushList();
  return <div className="text-slate-800 dark:text-slate-200 leading-relaxed">{blocks}</div>;
}

/** Renders the media of a lesson according to its content_type. */
function LessonMedia({ lesson, t }) {
  const url = lesson.media_url;
  const type = (lesson.content_type || 'TEXT').toUpperCase();

  if (!url || type === 'TEXT') return null;

  if (type === 'VIDEO') {
    const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
    if (isEmbed) {
      const embedUrl = url
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/');
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <video
        key={url}
        controls
        preload="metadata"
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-black max-h-[420px]"
      >
        <source src={url} />
        {t('course.video_fallback')}
      </video>
    );
  }

  if (type === 'PDF') {
    return (
      <div className="space-y-3">
        <object data={url} type="application/pdf" className="w-full h-[520px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="p-6 text-center">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {t('course.pdf_fallback')}
            </p>
          </div>
        </object>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" icon={Download}>{t('course.open_pdf')}</Button>
        </a>
      </div>
    );
  }

  if (type === 'IMAGE') {
    return <img src={url} alt={lesson.title} className="w-full rounded-xl border border-slate-200 dark:border-slate-700" />;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 dark:text-teal-400 font-semibold underline">
      {t('course.open_material')}
    </a>
  );
}

const TYPE_ICON = {
  TEXT: BookOpen,
  VIDEO: PlayCircle,
  PDF: FileText,
  IMAGE: ImageIcon,
  INTERACTIVE: GraduationCap
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useNotification();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/training/${courseId}`);
      if (res.success) {
        setCourse(res.data);
        const pct = res.data.enrollment ? res.data.enrollment.progress_percentage || 0 : 0;
        const total = (res.data.lessons || []).length;
        const alreadyDone = total ? Math.min(total, Math.round((pct / 100) * total)) : 0;
        setCompleted(Array.from({ length: alreadyDone }, (_, i) => i));
        setActiveIndex(alreadyDone > 0 && alreadyDone < total ? alreadyDone : 0);
      }
    } catch (err) {
      addToast(err.message || t('course.load_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const lessons = useMemo(() => course?.lessons || [], [course]);
  const activeLesson = lessons[activeIndex] || null;

  const progressPercentage = lessons.length
    ? Math.round((completed.length / lessons.length) * 100)
    : 0;

  const saveProgress = async (doneIndexes) => {
    if (!lessons.length) return;
    const pct = Math.round((doneIndexes.length / lessons.length) * 100);
    try {
      await api.put(`/training/${course.id}/progress`, { progressPercentage: pct });
    } catch (err) {
      // Progress is a convenience, never block the learner on a failed save
      console.warn('Progress not saved:', err.message);
    }
  };

  const markDoneAndAdvance = async () => {
    const doneIndexes = completed.includes(activeIndex) ? completed : [...completed, activeIndex];
    setCompleted(doneIndexes);
    await saveProgress(doneIndexes);

    if (activeIndex < lessons.length - 1) {
      setActiveIndex(activeIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast(
        t('training.lessons_completed', 'All lessons completed. You can now take the assessment.'),
        'success'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600 mb-4">{t('course.not_found')}</p>
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/volunteer/training')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const allLessonsDone = lessons.length > 0 && completed.length >= lessons.length;
  const estimatedHours = Number(course.estimated_hours || 0);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/volunteer/training')}>
            {t('common.back')}
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="sky">{enumLabel(t, course.category)}</Badge>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{course.code}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{course.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{course.description}</p>
          </div>
        </div>

        {course.certificate && (
          <Button variant="outline" size="sm" icon={Award} onClick={() => navigate('/volunteer/certificates')}>
            {t('training.view_certificate')}
          </Button>
        )}
      </div>

      {/* Meta + progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-slate-600 dark:text-slate-300 mb-4">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {lessons.length} {t('training.lessons')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {t('training.duration')}: <strong className="text-slate-800 dark:text-slate-200">{estimatedHours ? `${estimatedHours} ${t('common.hours')}` : '—'}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {t('training.passing_score')}: <strong className="text-slate-800 dark:text-slate-200">{course.passing_score_percentage || 80}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">{progressPercentage}%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Lesson list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:sticky lg:top-4">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('training.lessons')}</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
            {lessons.length === 0 && (
              <p className="p-5 text-xs text-slate-500 dark:text-slate-400">{t('course.no_lessons')}</p>
            )}
            {lessons.map((lesson, idx) => {
              const Icon = TYPE_ICON[(lesson.content_type || 'TEXT').toUpperCase()] || BookOpen;
              const isActive = idx === activeIndex;
              const isDone = completed.includes(idx);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive ? 'bg-teal-50/70 dark:bg-teal-950/60 border-l-4 border-teal-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-4 border-transparent'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${isDone ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs leading-snug ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {lesson.title}
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {(lesson.content_type || 'TEXT').toUpperCase()} · {lesson.duration_minutes || 15} min
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {course.quiz && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
              <Button
                className="w-full"
                size="sm"
                icon={GraduationCap}
                variant={allLessonsDone ? 'primary' : 'outline'}
                onClick={() => navigate(`/volunteer/quiz/${course.id}`)}
              >
                {t('training.take_quiz')}
              </Button>
              {!allLessonsDone && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  {t('course.finish_first')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lesson viewer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {!activeLesson ? (
            <div className="p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('course.no_content')}</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {t('training.lessons')} {activeIndex + 1} / {lessons.length}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{activeLesson.title}</h2>
                </div>
                <Badge variant={completed.includes(activeIndex) ? 'success' : 'neutral'}>
                  {(activeLesson.content_type || 'TEXT').toUpperCase()}
                </Badge>
              </div>

              <div className="p-6 space-y-5">
                <LessonMedia lesson={activeLesson} t={t} />
                <LessonBody text={activeLesson.body_content} />
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowLeft}
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                >
                  {t('common.previous')}
                </Button>

                {activeIndex < lessons.length - 1 ? (
                  <Button size="sm" icon={ArrowRight} onClick={markDoneAndAdvance}>
                    {t('common.next')}
                  </Button>
                ) : course.quiz ? (
                  <Button
                    size="sm"
                    icon={GraduationCap}
                    onClick={async () => {
                      await markDoneAndAdvance();
                      navigate(`/volunteer/quiz/${course.id}`);
                    }}
                  >
                    {t('training.take_quiz')}
                  </Button>
                ) : (
                  <Button size="sm" icon={CheckCircle2} onClick={markDoneAndAdvance}>
                    {t('training.mark_complete', 'Mark as complete')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
