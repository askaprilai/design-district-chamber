'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

// Persona definitions
const personas = {
  eco_warrior: {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Environmental champion focused on sustainability and climate action',
    color: 'emerald',
    icon: '🌱',
    traits: ['environmental action', 'sustainability', 'climate consciousness'],
    recommendations: [
      'Join local environmental cleanup initiatives',
      'Reduce carbon footprint through lifestyle changes',
      'Support renewable energy projects',
      'Participate in tree planting programs'
    ]
  },
  community_builder: {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Social connector dedicated to strengthening local communities',
    color: 'blue',
    icon: '🤝',
    traits: ['community engagement', 'social connection', 'local impact'],
    recommendations: [
      'Organize neighborhood events and gatherings',
      'Volunteer with local charities and nonprofits',
      'Mentor youth in your community',
      'Start community improvement projects'
    ]
  },
  health_focused: {
    id: 'health_focused',
    name: 'Health Advocate',
    description: 'Wellness enthusiast promoting healthy lifestyles and mental wellbeing',
    color: 'red',
    icon: '❤️',
    traits: ['health promotion', 'wellness advocacy', 'mental health awareness'],
    recommendations: [
      'Lead fitness or wellness groups',
      'Promote mental health awareness',
      'Support healthy food initiatives',
      'Organize wellness workshops'
    ]
  },
  tech_innovator: {
    id: 'tech_innovator',
    name: 'Tech Innovator',
    description: 'Technology enthusiast using innovation to solve social problems',
    color: 'purple',
    icon: '💻',
    traits: ['technological innovation', 'problem solving', 'digital literacy'],
    recommendations: [
      'Develop apps or tools for social good',
      'Teach digital skills to underserved communities',
      'Support tech-for-good initiatives',
      'Participate in hackathons for social causes'
    ]
  },
  social_impact: {
    id: 'social_impact',
    name: 'Social Impact Leader',
    description: 'Change agent focused on addressing social justice and equality',
    color: 'orange',
    icon: '✊',
    traits: ['social justice', 'advocacy', 'systemic change'],
    recommendations: [
      'Advocate for policy changes and social justice',
      'Support marginalized communities',
      'Lead awareness campaigns',
      'Participate in peaceful activism'
    ]
  },
  lifestyle_optimizer: {
    id: 'lifestyle_optimizer',
    name: 'Lifestyle Optimizer',
    description: 'Efficiency expert focused on productivity and personal development',
    color: 'indigo',
    icon: '⚡',
    traits: ['personal optimization', 'productivity', 'continuous improvement'],
    recommendations: [
      'Share productivity tips and life hacks',
      'Mentor others in goal achievement',
      'Organize skill-building workshops',
      'Lead by example in personal growth'
    ]
  }
};

// Quiz questions with scoring logic
const quizQuestions = [
  {
    id: 1,
    question: "What motivates you most when thinking about making a positive impact?",
    answers: [
      { text: "Protecting the environment for future generations", personas: { eco_warrior: 3, community_builder: 1 } },
      { text: "Bringing people together to solve shared challenges", personas: { community_builder: 3, social_impact: 1 } },
      { text: "Improving health and wellness in my community", personas: { health_focused: 3, community_builder: 1 } },
      { text: "Using technology to create innovative solutions", personas: { tech_innovator: 3, lifestyle_optimizer: 1 } },
      { text: "Fighting for justice and equality", personas: { social_impact: 3, community_builder: 1 } },
      { text: "Optimizing systems and helping others improve", personas: { lifestyle_optimizer: 3, tech_innovator: 1 } }
    ]
  },
  {
    id: 2,
    question: "When you have free time, you're most likely to:",
    answers: [
      { text: "Research sustainable living practices", personas: { eco_warrior: 3, lifestyle_optimizer: 1 } },
      { text: "Organize a get-together with friends and neighbors", personas: { community_builder: 3, social_impact: 1 } },
      { text: "Try a new fitness routine or wellness practice", personas: { health_focused: 3, lifestyle_optimizer: 1 } },
      { text: "Learn about emerging technologies", personas: { tech_innovator: 3, lifestyle_optimizer: 1 } },
      { text: "Read about social issues or volunteer", personas: { social_impact: 3, community_builder: 1 } },
      { text: "Optimize your daily routines and productivity systems", personas: { lifestyle_optimizer: 3, tech_innovator: 1 } }
    ]
  },
  {
    id: 3,
    question: "Your ideal weekend project would be:",
    answers: [
      { text: "Starting a community garden or composting program", personas: { eco_warrior: 3, community_builder: 2 } },
      { text: "Planning a neighborhood block party", personas: { community_builder: 3, social_impact: 1 } },
      { text: "Organizing a group fitness class or mental health workshop", personas: { health_focused: 3, community_builder: 2 } },
      { text: "Building an app or website for a local cause", personas: { tech_innovator: 3, lifestyle_optimizer: 1 } },
      { text: "Volunteering for a social justice organization", personas: { social_impact: 3, community_builder: 1 } },
      { text: "Creating systems to help others be more productive", personas: { lifestyle_optimizer: 3, tech_innovator: 2 } }
    ]
  },
  {
    id: 4,
    question: "When facing a community problem, your first instinct is to:",
    answers: [
      { text: "Research the environmental impact and sustainable solutions", personas: { eco_warrior: 3, tech_innovator: 1 } },
      { text: "Gather people together to brainstorm collective action", personas: { community_builder: 3, social_impact: 2 } },
      { text: "Consider the health and wellness implications", personas: { health_focused: 3, community_builder: 1 } },
      { text: "Look for technological tools or data-driven solutions", personas: { tech_innovator: 3, lifestyle_optimizer: 2 } },
      { text: "Analyze systemic causes and advocate for policy change", personas: { social_impact: 3, eco_warrior: 1 } },
      { text: "Break down the problem and create an efficient action plan", personas: { lifestyle_optimizer: 3, tech_innovator: 1 } }
    ]
  },
  {
    id: 5,
    question: "Your friends would describe your communication style as:",
    answers: [
      { text: "Passionate advocate who educates about sustainability", personas: { eco_warrior: 3, social_impact: 1 } },
      { text: "Natural connector who brings diverse groups together", personas: { community_builder: 3, health_focused: 1 } },
      { text: "Supportive coach focused on wellbeing", personas: { health_focused: 3, community_builder: 1 } },
      { text: "Clear explainer of complex technical concepts", personas: { tech_innovator: 3, lifestyle_optimizer: 2 } },
      { text: "Compelling speaker about social issues", personas: { social_impact: 3, community_builder: 1 } },
      { text: "Practical advisor sharing actionable tips", personas: { lifestyle_optimizer: 3, health_focused: 1 } }
    ]
  },
  {
    id: 6,
    question: "Success for you means:",
    answers: [
      { text: "Measurably reducing environmental damage", personas: { eco_warrior: 3, lifestyle_optimizer: 1 } },
      { text: "Seeing stronger, more connected communities", personas: { community_builder: 3, social_impact: 2 } },
      { text: "Improving people's physical and mental health", personas: { health_focused: 3, community_builder: 1 } },
      { text: "Creating scalable solutions through innovation", personas: { tech_innovator: 3, lifestyle_optimizer: 2 } },
      { text: "Achieving meaningful social and policy change", personas: { social_impact: 3, eco_warrior: 1 } },
      { text: "Helping others achieve their maximum potential", personas: { lifestyle_optimizer: 3, health_focused: 2 } }
    ]
  }
];

interface QuizProps {
  onComplete: (persona: typeof personas[keyof typeof personas], scores: Record<string, number>) => void;
  onClose?: () => void;
}

export default function RoutingQuiz({ onComplete, onClose }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    eco_warrior: 0,
    community_builder: 0,
    health_focused: 0,
    tech_innovator: 0,
    social_impact: 0,
    lifestyle_optimizer: 0
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedAnswer === null) return;

    const question = quizQuestions[currentQuestion];
    const answer = question.answers[selectedAnswer];
    
    // Update scores based on selected answer
    const newScores = { ...scores };
    Object.entries(answer.personas).forEach(([persona, points]) => {
      newScores[persona] += points;
    });
    
    setScores(newScores);
    setAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
    setSelectedAnswer(null);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz complete - determine persona
      const topPersona = Object.entries(newScores).reduce((a, b) => 
        newScores[a[0]] > newScores[b[0]] ? a : b
      )[0];
      
      setShowResult(true);
      onComplete(personas[topPersona as keyof typeof personas], newScores);
    }
  }, [selectedAnswer, currentQuestion, scores, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  }, [currentQuestion, answers]);

  const progressPercentage = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const question = quizQuestions[currentQuestion];

  if (showResult) {
    const topPersona = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];
    const resultPersona = personas[topPersona as keyof typeof personas];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-4"
          >
            {resultPersona.icon}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            You're a {resultPersona.name}!
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            {resultPersona.description}
          </p>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Key Traits:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {resultPersona.traits.map((trait, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 bg-${resultPersona.color}-100 text-${resultPersona.color}-800 rounded-full text-sm font-medium`}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Recommended Actions:</h3>
            <div className="grid gap-3 text-left">
              {resultPersona.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Retake Quiz
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`px-6 py-3 bg-${resultPersona.color}-600 text-white rounded-lg font-medium hover:bg-${resultPersona.color}-700 transition-colors`}
              >
                Continue to Platform
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Impact Persona Quiz</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            style={{ width: `${progressPercentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
          <span>{Math.round(progressPercentage)}% complete</span>
        </div>
      </div>

      {/* Question */}
      <div className="p-8">
        <motion.h2
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold text-gray-900 mb-6"
        >
          {question.question}
        </motion.h2>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {question.answers.map((answer, index) => (
              <motion.button
                key={`${currentQuestion}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full rounded-full bg-white flex items-center justify-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </motion.div>
                    )}
                  </div>
                  <span className="font-medium">{answer.text}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-8 pb-8 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {currentQuestion === quizQuestions.length - 1 ? 'Get Results' : 'Next'}
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}