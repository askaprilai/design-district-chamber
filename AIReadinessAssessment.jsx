import React, { useState } from 'react';
import './AIReadinessAssessment.css';

const AIReadinessAssessment = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [answers, setAnswers] = useState({});
  const [userInfo, setUserInfo] = useState({ 
    name: '', 
    email: '', 
    company: '', 
    role: '', 
    industry: '', 
    companySize: '' 
  });
  const [results, setResults] = useState(null);

  const questions = [
    {
      id: 'tools_current',
      category: 'Current AI Usage',
      text: "How many AI tools does your organization currently use regularly?",
      type: 'multiple_choice',
      options: [
        { value: 1, text: "None", weight: 0 },
        { value: 2, text: "1-2 basic tools (ChatGPT, etc.)", weight: 2 },
        { value: 3, text: "3-5 tools across departments", weight: 4 },
        { value: 4, text: "6-10 integrated tools", weight: 6 },
        { value: 5, text: "10+ tools with enterprise integration", weight: 8 }
      ]
    },
    {
      id: 'comfort_employees',
      category: 'Employee Readiness',
      text: "What percentage of your employees are comfortable using AI tools?",
      type: 'multiple_choice',
      options: [
        { value: 1, text: "Less than 10%", weight: 0 },
        { value: 2, text: "10-25%", weight: 2 },
        { value: 3, text: "26-50%", weight: 4 },
        { value: 4, text: "51-75%", weight: 6 },
        { value: 5, text: "More than 75%", weight: 8 }
      ]
    },
    {
      id: 'marketing_ai',
      category: 'Marketing & Sales',
      text: "How advanced is your marketing team's AI knowledge?",
      type: 'scale',
      options: [
        { value: 1, text: "No AI experience", weight: 0 },
        { value: 2, text: "Basic awareness", weight: 1 },
        { value: 3, text: "Some experimentation", weight: 2 },
        { value: 4, text: "Regular usage", weight: 3 },
        { value: 5, text: "Advanced implementation", weight: 4 }
      ]
    },
    {
      id: 'operations_ai',
      category: 'Operations',
      text: "Does your operations team use AI for automation or optimization?",
      type: 'scale',
      options: [
        { value: 1, text: "Not at all", weight: 0 },
        { value: 2, text: "Minimal use", weight: 1 },
        { value: 3, text: "Some processes", weight: 2 },
        { value: 4, text: "Many processes", weight: 3 },
        { value: 5, text: "Fully integrated", weight: 4 }
      ]
    },
    {
      id: 'hr_ai',
      category: 'Human Resources',
      text: "How does your HR team leverage AI tools?",
      type: 'scale',
      options: [
        { value: 1, text: "No AI usage", weight: 0 },
        { value: 2, text: "Basic recruitment tools", weight: 1 },
        { value: 3, text: "Multiple HR AI tools", weight: 2 },
        { value: 4, text: "Integrated AI systems", weight: 3 },
        { value: 5, text: "AI-driven HR strategy", weight: 4 }
      ]
    },
    {
      id: 'governance_policies',
      category: 'Governance & Policies',
      text: "What AI governance policies does your organization have?",
      type: 'multiple_choice',
      options: [
        { value: 1, text: "No formal policies", weight: 0 },
        { value: 2, text: "Basic usage guidelines", weight: 2 },
        { value: 3, text: "Department-specific policies", weight: 4 },
        { value: 4, text: "Comprehensive AI governance", weight: 6 },
        { value: 5, text: "Enterprise AI strategy with compliance", weight: 8 }
      ]
    },
    {
      id: 'barriers_cost',
      category: 'Implementation Barriers',
      text: "What are your biggest barriers to AI adoption? (Cost perspective)",
      type: 'scale',
      options: [
        { value: 1, text: "Major budget constraints", weight: 0 },
        { value: 2, text: "Limited budget", weight: 1 },
        { value: 3, text: "Moderate budget available", weight: 2 },
        { value: 4, text: "Good budget allocation", weight: 3 },
        { value: 5, text: "Ample AI investment budget", weight: 4 }
      ]
    },
    {
      id: 'barriers_skills',
      category: 'Skills & Training',
      text: "How would you rate your organization's AI skills gap?",
      type: 'scale',
      options: [
        { value: 1, text: "Severe skills shortage", weight: 0 },
        { value: 2, text: "Significant gap", weight: 1 },
        { value: 3, text: "Moderate gap", weight: 2 },
        { value: 4, text: "Minor gap", weight: 3 },
        { value: 5, text: "Well-equipped team", weight: 4 }
      ]
    },
    {
      id: 'compliance_concerns',
      category: 'Compliance & Security',
      text: "How concerned is your organization about AI compliance and security?",
      type: 'scale',
      options: [
        { value: 1, text: "Extremely concerned/blocked", weight: 0 },
        { value: 2, text: "Very cautious", weight: 1 },
        { value: 3, text: "Moderately concerned", weight: 2 },
        { value: 4, text: "Manageable concerns", weight: 3 },
        { value: 5, text: "Confident in security", weight: 4 }
      ]
    },
    {
      id: 'leadership_support',
      category: 'Leadership & Culture',
      text: "How supportive is your leadership team of AI initiatives?",
      type: 'scale',
      options: [
        { value: 1, text: "Resistant to AI", weight: 0 },
        { value: 2, text: "Skeptical but open", weight: 1 },
        { value: 3, text: "Neutral/waiting", weight: 2 },
        { value: 4, text: "Supportive", weight: 3 },
        { value: 5, text: "Championing AI adoption", weight: 4 }
      ]
    }
  ];

  const handleAnswerChange = (questionId, value, weight) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, weight }
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;
    const categoryScores = {};

    questions.forEach(question => {
      if (answers[question.id]) {
        totalScore += answers[question.id].weight;
        
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { score: 0, max: 0 };
        }
        categoryScores[question.category].score += answers[question.id].weight;
      }
      
      maxScore += Math.max(...question.options.map(opt => opt.weight));
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = { score: 0, max: 0 };
      }
      categoryScores[question.category].max += Math.max(...question.options.map(opt => opt.weight));
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    
    return { totalScore, maxScore, percentage, categoryScores };
  };

  const getResultCategory = (percentage, categoryScores) => {
    let category, description, recommendations, bootcampPath;
    
    if (percentage >= 80) {
      category = "AI Advanced";
      description = "Congratulations! Your organization is leading in AI adoption with strong foundations across all areas.";
      bootcampPath = "ai_mastery";
      recommendations = {
        immediate: [
          "Focus on AI innovation and competitive advantage",
          "Become an AI Center of Excellence",
          "Mentor other organizations in AI adoption",
          "Explore cutting-edge AI technologies"
        ],
        bootcamp: "Advanced AI Leadership & Innovation Track",
        timeline: "Continuous innovation cycle"
      };
    } else if (percentage >= 60) {
      category = "AI Ready";
      description = "You're well-positioned for AI success! Your organization has good foundations with some areas for strategic improvement.";
      bootcampPath = "ai_acceleration";
      recommendations = {
        immediate: [
          "Scale successful AI implementations",
          "Address remaining skill gaps through targeted training",
          "Expand AI governance and policies",
          "Increase cross-department collaboration"
        ],
        bootcamp: "AI Acceleration & Scaling Track",
        timeline: "6-9 months to full optimization"
      };
    } else if (percentage >= 40) {
      category = "AI Developing";
      description = "Your organization is making progress but needs strategic focus to accelerate AI adoption and maximize ROI.";
      bootcampPath = "ai_fundamentals";
      recommendations = {
        immediate: [
          "Establish AI governance framework",
          "Invest in comprehensive team training",
          "Start with high-impact, low-risk AI pilots",
          "Build internal AI advocacy champions"
        ],
        bootcamp: "AI Fundamentals & Implementation Track",
        timeline: "9-12 months to readiness"
      };
    } else {
      category = "AI Beginner";
      description = "You're at the perfect starting point! Every AI leader began here. With the right strategy, you can rapidly advance.";
      bootcampPath = "ai_foundation";
      recommendations = {
        immediate: [
          "Start with basic AI literacy training company-wide",
          "Identify AI champions in each department",
          "Begin with simple, proven AI tools",
          "Create AI experimentation safe spaces"
        ],
        bootcamp: "AI Foundation & Readiness Track",
        timeline: "12-18 months to full readiness"
      };
    }

    return { category, description, recommendations, bootcampPath };
  };

  const generateDepartmentBreakdown = (categoryScores) => {
    const breakdown = {};
    
    Object.keys(categoryScores).forEach(category => {
      const score = categoryScores[category];
      const percentage = Math.round((score.score / score.max) * 100);
      
      let status, priority;
      if (percentage >= 75) {
        status = "Strong";
        priority = "low";
      } else if (percentage >= 50) {
        status = "Developing";
        priority = "medium";
      } else {
        status = "Needs Focus";
        priority = "high";
      }
      
      breakdown[category] = {
        percentage,
        status,
        priority,
        score: score.score,
        max: score.max
      };
    });
    
    return breakdown;
  };

  const handleQuizSubmit = () => {
    const scoreData = calculateScore();
    const resultCategory = getResultCategory(scoreData.percentage, scoreData.categoryScores);
    const departmentBreakdown = generateDepartmentBreakdown(scoreData.categoryScores);
    
    setResults({
      ...scoreData,
      ...resultCategory,
      departmentBreakdown,
      userInfo
    });

    // Log lead capture data
    console.log('AI Readiness Lead Captured:', {
      ...userInfo,
      score: scoreData.totalScore,
      percentage: scoreData.percentage,
      category: resultCategory.category,
      departmentBreakdown,
      answers,
      timestamp: new Date().toISOString()
    });

    setCurrentStep('results');
  };

  // Welcome Screen
  if (currentStep === 'welcome') {
    return (
      <div className="assessment-container">
        <div className="welcome-screen">
          <div className="welcome-header">
            <h1>🤖 AI Readiness Assessment</h1>
            <h2>Discover Your Organization's AI Adoption Score</h2>
          </div>
          
          <div className="welcome-content">
            <p className="intro-text">
              Measure your organization's current AI readiness across all departments and receive a 
              personalized development roadmap with automated training recommendations.
            </p>
            
            <div className="assessment-benefits">
              <div className="benefit">
                <span className="benefit-icon">📊</span>
                <span>Get your AI Adoption Score (0-100)</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🏢</span>
                <span>Department-by-department breakdown</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🎯</span>
                <span>Personalized AI learning path</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🚀</span>
                <span>Instant access to AI bootcamps</span>
              </div>
            </div>
          </div>
          
          <button 
            className="start-assessment-btn"
            onClick={() => setCurrentStep('questions')}
          >
            Start Assessment →
          </button>
        </div>
      </div>
    );
  }

  // Questions Screen
  if (currentStep === 'questions') {
    const allAnswered = questions.every(q => answers[q.id]);
    
    return (
      <div className="assessment-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="questions-screen">
          <h2>AI Readiness Diagnostic</h2>
          <p className="questions-subtitle">Answer honestly for the most accurate assessment</p>
          
          <div className="questions-list">
            {questions.map((question, index) => (
              <div key={question.id} className="question-block">
                <div className="question-header">
                  <span className="question-category">{question.category}</span>
                  <h3>
                    <span className="question-number">{index + 1}</span>
                    {question.text}
                  </h3>
                </div>
                
                <div className="options-container">
                  {question.options.map(option => (
                    <label key={option.value} className="option-label">
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        value={option.value}
                        checked={answers[question.id]?.value === option.value}
                        onChange={() => handleAnswerChange(question.id, option.value, option.weight)}
                      />
                      <div className="option-button">
                        <span className="option-text">{option.text}</span>
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
            Get My AI Readiness Score →
          </button>
        </div>
      </div>
    );
  }

  // Lead Capture Screen
  if (currentStep === 'capture') {
    const canSubmit = userInfo.name && userInfo.email && userInfo.company && userInfo.role;
    
    return (
      <div className="assessment-container">
        <div className="capture-screen">
          <div className="capture-header">
            <h2>🎯 Get Your Personalized AI Readiness Report</h2>
            <p>Enter your details to receive your complete score breakdown and customized AI adoption roadmap.</p>
          </div>
          
          <form className="capture-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
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
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">Company Name *</label>
                <input
                  type="text"
                  id="company"
                  value={userInfo.company}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Your company name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Your Role *</label>
                <input
                  type="text"
                  id="role"
                  value={userInfo.role}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. CEO, VP Operations, etc."
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <select
                  id="industry"
                  value={userInfo.industry}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, industry: e.target.value }))}
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="education">Education</option>
                  <option value="professional_services">Professional Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="companySize">Company Size</label>
                <select
                  id="companySize"
                  value={userInfo.companySize}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, companySize: e.target.value }))}
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
            
            <div className="privacy-note">
              <small>🔒 Your information is secure. You'll receive your AI readiness report immediately plus access to personalized bootcamps.</small>
            </div>
            
            <button 
              className={`get-results-btn ${canSubmit ? 'enabled' : 'disabled'}`}
              disabled={!canSubmit}
              onClick={handleQuizSubmit}
            >
              Get My AI Readiness Score & Bootcamp Access →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Results Screen
  if (currentStep === 'results' && results) {
    return (
      <div className="assessment-container">
        <div className="results-screen">
          <div className="results-header">
            <div className="score-display">
              <div className="score-number">{results.percentage}%</div>
              <div className="score-category">{results.category}</div>
              <div className="score-subtitle">AI Readiness Score</div>
            </div>
            
            <h2>{userInfo.name}, here's your AI adoption roadmap</h2>
            <p className="results-description">{results.description}</p>
          </div>

          <div className="department-breakdown">
            <h3>Department-by-Department Analysis</h3>
            <div className="departments-grid">
              {Object.entries(results.departmentBreakdown).map(([dept, data]) => (
                <div key={dept} className={`department-card ${data.priority}`}>
                  <div className="dept-header">
                    <h4>{dept}</h4>
                    <span className={`status ${data.priority}`}>{data.status}</span>
                  </div>
                  <div className="dept-score">
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${data.percentage}%` }}
                      ></div>
                    </div>
                    <span className="dept-percentage">{data.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="recommendations-section">
            <h3>Your Immediate Action Plan</h3>
            <ul className="recommendations-list">
              {results.recommendations.immediate.map((rec, index) => (
                <li key={index} className="recommendation">
                  <span className="rec-icon">🎯</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="bootcamp-section">
            <h3>🚀 Your Personalized AI Bootcamp is Ready!</h3>
            <div className="bootcamp-card">
              <h4>{results.recommendations.bootcamp}</h4>
              <p>Estimated completion: {results.recommendations.timeline}</p>
              <p>100% AI-generated learning path based on your assessment results</p>
            </div>
          </div>
          
          <div className="cta-section">
            <h3>Ready to Transform Your Organization with AI?</h3>
            <p>Join thousands of companies using Ask April AI's proven methodology to accelerate AI adoption.</p>
            
            <div className="cta-buttons">
              <button 
                className="primary-cta"
                onClick={() => window.open(`https://askaprilai.newzenler.com/bootcamp/${results.bootcampPath}`, '_blank')}
              >
                Start My AI Bootcamp Now
              </button>
              
              <button 
                className="secondary-cta"
                onClick={() => window.open('https://calendly.com/aprilcoaching/ai-strategy-session', '_blank')}
              >
                Book AI Strategy Session
              </button>
            </div>
          </div>
          
          <div className="personalized-message">
            <h4>Personal Message for {userInfo.name}:</h4>
            <p>
              Based on your {results.percentage}% AI readiness score, {userInfo.company} is positioned in the <strong>{results.category}</strong> category. 
              Your detailed AI adoption roadmap and access to your personalized bootcamp will be sent to {userInfo.email} within the next few minutes.
            </p>
          </div>
          
          <div className="restart-section">
            <button className="restart-btn" onClick={() => {
              setCurrentStep('welcome');
              setAnswers({});
              setUserInfo({ name: '', email: '', company: '', role: '', industry: '', companySize: '' });
              setResults(null);
            }}>
              Take Assessment Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIReadinessAssessment;