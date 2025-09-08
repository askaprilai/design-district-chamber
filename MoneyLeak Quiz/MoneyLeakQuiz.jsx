import React, { useState } from 'react';
import './MoneyLeakQuiz.css';

const MoneyLeakQuiz = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [answers, setAnswers] = useState({});
  const [userInfo, setUserInfo] = useState({ name: '', email: '', company: '' });
  const [results, setResults] = useState(null);

  const questions = [
    {
      id: 1,
      text: "Do you find yourself constantly stepping in to solve team issues?",
      reverse: false
    },
    {
      id: 2,
      text: "Are your managers unclear on how to give effective performance feedback?",
      reverse: false
    },
    {
      id: 3,
      text: "Do you frequently deal with high team turnover or rehiring costs?",
      reverse: false
    },
    {
      id: 4,
      text: "Are customer complaints linked to staff behavior or service delivery?",
      reverse: false
    },
    {
      id: 5,
      text: "Do your managers avoid having accountability conversations with team members?",
      reverse: false
    },
    {
      id: 6,
      text: "Is inconsistent execution affecting your store or service performance?",
      reverse: false
    },
    {
      id: 7,
      text: "Have your managers received formal training in the last 6 months?",
      reverse: true
    }
  ];

  const scaleLabels = {
    1: 'Never',
    2: 'Rarely',
    3: 'Sometimes',
    4: 'Often',
    5: 'Always'
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    
    questions.forEach(question => {
      const answer = answers[question.id] || 0;
      if (question.reverse) {
        // Reverse scoring for question 7
        totalScore += (6 - answer);
      } else {
        totalScore += answer;
      }
    });

    return totalScore;
  };

  const getResultCategory = (score) => {
    if (score >= 5 && score <= 14) {
      return {
        category: 'Minimal Leak',
        emoji: '💵',
        color: '#28a745',
        title: 'You\'re doing well but have small cracks',
        description: 'You\'re in good shape! Your leadership foundation is solid, but there\'s always room for fine-tuning. Small improvements in management training could unlock even more potential.',
        recommendations: [
          'Continue regular leadership development sessions',
          'Focus on preventive training to maintain your edge',
          'Consider advanced leadership coaching for your top performers',
          'Implement quarterly leadership assessments'
        ],
        ctaText: 'Optimize Your Leadership',
        urgency: 'low'
      };
    } else if (score >= 15 && score <= 24) {
      return {
        category: 'Moderate Leak',
        emoji: '💸',
        color: '#ffc107',
        title: 'Leadership gaps are costing you money',
        description: 'You\'re leaving money on the table. Your managers have potential but need structured support to perform at their best. The gaps are manageable with the right training.',
        recommendations: [
          'Implement immediate management training program',
          'Establish clear performance feedback systems',
          'Create accountability frameworks for managers',
          'Invest in leadership coaching within 30 days'
        ],
        ctaText: 'Stop the Money Leak Now',
        urgency: 'medium'
      };
    } else {
      return {
        category: 'Severe Leak',
        emoji: '🩸',
        color: '#dc3545',
        title: 'You\'re bleeding profits from the top down',
        description: 'URGENT: Your business is hemorrhaging money due to leadership gaps. Every day without action costs you more. Your managers need immediate, intensive support.',
        recommendations: [
          'IMMEDIATE management intervention required',
          'Emergency leadership training within 7 days',
          'One-on-one coaching for all managers',
          'Complete management system overhaul needed'
        ],
        ctaText: 'Emergency Leadership Intervention',
        urgency: 'high'
      };
    }
  };

  const handleQuizSubmit = () => {
    const score = calculateScore();
    const resultData = getResultCategory(score);
    
    setResults({
      score,
      maxScore: 35,
      percentage: Math.round((score / 35) * 100),
      ...resultData
    });

    // Log lead capture data (replace with your email service integration)
    console.log('Lead Captured:', {
      ...userInfo,
      score,
      category: resultData.category,
      answers,
      timestamp: new Date().toISOString()
    });

    setCurrentStep('results');
  };

  const restartQuiz = () => {
    setCurrentStep('welcome');
    setAnswers({});
    setUserInfo({ name: '', email: '', company: '' });
    setResults(null);
  };

  // Welcome Screen
  if (currentStep === 'welcome') {
    return (
      <div className="quiz-container">
        <div className="welcome-screen">
          <div className="welcome-header">
            <h1>💸 Money Leak Quiz</h1>
            <h2>Are You Leaking Money Because of Poor Management Training?</h2>
          </div>
          
          <div className="welcome-content">
            <p className="intro-text">
              Discover how much money your business might be losing due to untrained or underperforming managers. 
              Take this 2-minute quiz to get your personalized <strong>Money Leak Score</strong>—and learn how to plug the gaps.
            </p>
            
            <div className="quiz-benefits">
              <div className="benefit">
                <span className="benefit-icon">⏱️</span>
                <span>Takes only 2 minutes</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">📊</span>
                <span>Get your personalized score</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">💡</span>
                <span>Receive actionable recommendations</span>
              </div>
            </div>
          </div>
          
          <button 
            className="start-quiz-btn"
            onClick={() => setCurrentStep('questions')}
          >
            Start Quiz →
          </button>
        </div>
      </div>
    );
  }

  // Questions Screen
  if (currentStep === 'questions') {
    const allAnswered = questions.every(q => answers[q.id]);
    
    return (
      <div className="quiz-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="questions-screen">
          <h2>Answer each question honestly (1-5 scale)</h2>
          
          <div className="questions-list">
            {questions.map((question, index) => (
              <div key={question.id} className="question-block">
                <h3>
                  <span className="question-number">{index + 1}</span>
                  {question.text}
                </h3>
                
                <div className="scale-container">
                  {[1, 2, 3, 4, 5].map(value => (
                    <label key={value} className="scale-option">
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        value={value}
                        checked={answers[question.id] === value}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      />
                      <div className="scale-button">
                        <span className="scale-number">{value}</span>
                        <span className="scale-label">{scaleLabels[value]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className={`continue-btn ${allAnswered ? 'enabled' : 'disabled'}`}
            disabled={!allAnswered}
            onClick={() => setCurrentStep('capture')}
          >
            Get My Results →
          </button>
        </div>
      </div>
    );
  }

  // Email Capture Screen
  if (currentStep === 'capture') {
    const canSubmit = userInfo.name && userInfo.email;
    
    return (
      <div className="quiz-container">
        <div className="capture-screen">
          <div className="capture-header">
            <h2>🎯 Get Your Personalized Money Leak Report</h2>
            <p>Enter your details to receive your complete score breakdown and customized action plan.</p>
          </div>
          
          <form className="capture-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={userInfo.name}
                onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company">Company Name (Optional)</label>
              <input
                type="text"
                id="company"
                value={userInfo.company}
                onChange={(e) => setUserInfo(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter your company name"
              />
            </div>
            
            <div className="privacy-note">
              <small>🔒 Your information is secure and will never be shared. You'll receive your results immediately plus valuable leadership tips.</small>
            </div>
            
            <button 
              className={`get-results-btn ${canSubmit ? 'enabled' : 'disabled'}`}
              disabled={!canSubmit}
              onClick={handleQuizSubmit}
            >
              Get My Money Leak Score →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Results Screen
  if (currentStep === 'results' && results) {
    return (
      <div className="quiz-container">
        <div className="results-screen">
          <div className="results-header">
            <div className="score-display" style={{ borderColor: results.color }}>
              <div className="score-emoji">{results.emoji}</div>
              <div className="score-number">{results.score}/35</div>
              <div className="score-category" style={{ color: results.color }}>
                {results.category}
              </div>
            </div>
            
            <h2 style={{ color: results.color }}>{results.title}</h2>
            <p className="results-description">{results.description}</p>
          </div>
          
          <div className="recommendations-section">
            <h3>Your Personalized Action Plan:</h3>
            <ul className="recommendations-list">
              {results.recommendations.map((rec, index) => (
                <li key={index} className={`recommendation ${results.urgency}`}>
                  <span className="rec-icon">
                    {results.urgency === 'high' ? '🚨' : results.urgency === 'medium' ? '⚠️' : '✅'}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="cta-section">
            <h3>Ready to Stop the Money Leak?</h3>
            <p>Join thousands of leaders who've transformed their management teams with Ask April AI's proven leadership training.</p>
            
            <div className="cta-buttons">
              <button 
                className="primary-cta"
                style={{ backgroundColor: results.color }}
                onClick={() => window.open('https://askaprilai.newzenler.com/aprilai', '_blank')}
              >
                {results.ctaText}
              </button>
              
              <button 
                className="secondary-cta"
                onClick={() => window.open('https://calendly.com/aprilcoaching/salesstrategysession', '_blank')}
              >
                Book Strategy Session
              </button>
            </div>
          </div>
          
          <div className="personalized-message">
            <h4>Personal Message for {userInfo.name}:</h4>
            <p>
              Based on your score of {results.score}/35, your {userInfo.company ? `team at ${userInfo.company}` : 'leadership team'} 
              {results.urgency === 'high' ? ' needs immediate attention' : 
               results.urgency === 'medium' ? ' has room for significant improvement' : 
               ' is on the right track with opportunities for fine-tuning'}. 
              
              We'll send detailed recommendations to {userInfo.email} within the next few minutes.
            </p>
          </div>
          
          <div className="restart-section">
            <button className="restart-btn" onClick={restartQuiz}>
              Take Quiz Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MoneyLeakQuiz;