import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { GraduationCap, Award, CheckCircle2, XCircle, ArrowLeft, Loader2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import confetti from 'canvas-confetti';

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useNotification();

  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get(`/training/${courseId}/quiz`);
      if (res.success) {
        setCourse(res.data.course);
        setQuiz(res.data.quiz);
      }
    } catch (err) {
      setLoadError(err.message || t('quiz.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  // The API returns options in a fixed order (correct answer first in the seed data),
  // so they are shuffled per question - deterministically, so re-renders keep the order.
  const shuffledQuestions = useMemo(() => {
    const list = quiz?.questions || [];
    return list.map((q) => {
      const options = [...(q.answers || [])];
      let seed = String(q.id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      for (let i = options.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = seed % (i + 1);
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { ...q, answers: options };
    });
  }, [quiz]);

  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const unanswered = shuffledQuestions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      addToast(
        t('training.answer_all', `Please answer all questions (${unanswered.length} remaining).`),
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/training/${courseId}/quiz/submit`, { answers });
      if (res.success) {
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (res.data.passed) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          addToast(t('training.passed_congrats'), 'success');
        } else {
          addToast(t('training.failed_retry'), 'error');
        }
      }
    } catch (err) {
      addToast(err.message || t('quiz.submit_failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('quiz.unavailable')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{loadError || t('quiz.no_quiz')}</p>
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/volunteer/training')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const questions = shuffledQuestions;
  const passingScore = course?.passingScore || quiz.passing_score || 80;

  if (result) {
    const certificateNumber =
      result.certificate?.certificateNumber || result.certificate?.certificate_number || null;

    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border p-8 text-center shadow-lg ${
            result.passed ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'
          }`}
        >
          {result.passed ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{t('quiz.passed')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('quiz.verified_by')}</p>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900/60 max-w-sm mx-auto mb-6">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">{t('quiz.your_score')}</p>
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{result.percentageScore}%</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                  {result.totalScore} / {result.totalPossible} points
                </p>
                {certificateNumber && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">{t('quiz.cert_issued')}</p>
                    <p className="font-mono font-bold text-xs text-emerald-900 dark:text-emerald-200 mt-0.5">{certificateNumber}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/volunteer/certificates')} icon={Award}>
                  {t('quiz.view_cert')}
                </Button>
                <Button variant="outline" onClick={() => navigate('/volunteer/training')}>
                  {t('quiz.back_courses')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{t('quiz.not_passed')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {t('quiz.you_scored')} <strong className="text-slate-900 dark:text-white">{result.percentageScore}%</strong>. Required passing threshold is{' '}
                <strong className="text-slate-900 dark:text-white">{result.passingScore || passingScore}%</strong>.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={retake} icon={RefreshCw}>
                  {t('quiz.retake')}
                </Button>
                <Button variant="outline" onClick={() => navigate(`/volunteer/training/${courseId}`)}>
                  {t('quiz.review_material')}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Answer review with explanations */}
        {Array.isArray(result.questionResults) && result.questionResults.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('quiz.review')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('quiz.review_hint')}</p>
            </div>
            {result.questionResults.map((qr, idx) => (
              <div key={qr.questionId} className="px-6 py-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 ${qr.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {qr.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="text-teal-700 dark:text-teal-400 mr-1">{idx + 1}.</span>
                    {qr.questionText}
                  </p>
                </div>
                {qr.explanation && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                    <strong className="text-slate-700 dark:text-slate-300">{t('quiz.why')} </strong>{qr.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(`/volunteer/training/${courseId}`)} icon={ArrowLeft}>
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{quiz.title || course?.title || t('training.quiz_title')}</h1>
          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
            {t('quiz.answer_all_hint')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-3.5 shadow-sm flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          {t('training.passing_score')}: <strong>{passingScore}%</strong>
        </span>
        {quiz.time_limit_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {quiz.time_limit_minutes} min
          </span>
        )}
        <span className="ml-auto font-semibold text-slate-700 dark:text-slate-300">
          {answeredCount} / {questions.length} {t('quiz.answered')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              <span className="text-teal-700 dark:text-teal-400 mr-2">{idx + 1}.</span>
              {q.question_text}
              {q.points ? <span className="ml-2 text-[10px] font-semibold text-slate-400">({q.points} pts)</span> : null}
            </h3>
            <div className="space-y-2">
              {(q.answers || []).map((opt) => {
                const isSelected = answers[q.id] === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectAnswer(q.id, opt.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/60 border-teal-500 ring-1 ring-teal-500 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium leading-relaxed">{opt.answer_text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="submit" loading={submitting} size="lg" icon={GraduationCap}>
            {t('training.submit_quiz')}
          </Button>
        </div>
      </form>
    </div>
  );
}
