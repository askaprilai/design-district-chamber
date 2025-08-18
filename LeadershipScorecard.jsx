import React, { useState } from 'react';
import './LeadershipScorecard.css';

const LeadershipScorecard = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    answers: {}
  });
  
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  const questions = [
    "I actively listen to my team members and value their input",
    "I inspire and motivate others to achieve their best",
    "I communicate vision and goals clearly to my team",
    "I lead by example and demonstrate integrity",
    "I provide constructive feedback and support growth",
    "I adapt my leadership style to different situations",
    "I build trust and foster collaboration within my team",
    "I make decisions confidently and take responsibility",
    "I recognize and celebrate team achievements",
    "I continuously seek to improve and learn as a leader"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnswerChange = (questionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: parseInt(value)
      }
    }));
  };

  const calculateScore = () => {
    const totalScore = Object.values(formData.answers).reduce((sum, score) => sum + score, 0);
    const maxScore = 50;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    let category, description, recommendations;
    
    if (percentage >= 85) {
      category = "Exceptional Leader";
      description = "You demonstrate outstanding leadership qualities and consistently inspire others to achieve excellence.";
      recommendations = {
        strengths: [
          "Exceptional communication and vision-setting abilities",
          "Strong emotional intelligence and team-building skills",
          "Consistent demonstration of integrity and accountability",
          "Effective at adapting leadership style to different situations"
        ],
        growth: [
          "Consider mentoring other emerging leaders",
          "Explore strategic leadership and organizational transformation",
          "Develop expertise in leading through change and uncertainty",
          "Focus on building high-performance culture at scale"
        ]
      };
    } else if (percentage >= 70) {
      category = "Strong Leader";
      description = "You have solid leadership foundations with room for focused development in key areas.";
      recommendations = {
        strengths: [
          "Good foundational leadership skills",
          "Ability to motivate and guide team members",
          "Decent communication and decision-making abilities",
          "Shows initiative in personal development"
        ],
        growth: [
          "Enhance active listening and empathy skills",
          "Develop more consistent feedback and coaching abilities",
          "Work on adapting leadership style to different team members",
          "Focus on building stronger team collaboration"
        ]
      };
    } else if (percentage >= 55) {
      category = "Developing Leader";
      description = "You show leadership potential with opportunities for significant growth and skill development.";
      recommendations = {
        strengths: [
          "Shows willingness to take on leadership responsibilities",
          "Demonstrates some natural leadership instincts",
          "Has foundation skills that can be built upon",
          "Shows commitment to personal growth"
        ],
        growth: [
          "Develop clear communication and vision-setting skills",
          "Build confidence in decision-making and accountability",
          "Learn effective team motivation and engagement techniques",
          "Practice active listening and emotional intelligence"
        ]
      };
    } else {
      category = "Emerging Leader";
      description = "You're at the beginning of your leadership journey with tremendous potential for growth.";
      recommendations = {
        strengths: [
          "Every great leader started somewhere - you're taking the first step",
          "You have the awareness to seek growth and development",
          "With focused effort, you can develop strong leadership skills",
          "Your commitment to improvement is already a leadership quality"
        ],
        growth: [
          "Focus on developing self-awareness and emotional intelligence",
          "Practice basic communication and listening skills",
          "Learn fundamental principles of team leadership",
          "Build confidence through small leadership opportunities"
        ]
      };
    }
    
    return {
      totalScore,
      percentage,
      category,
      description,
      recommendations
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all questions are answered
    if (Object.keys(formData.answers).length < 10) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    const calculatedResults = calculateScore();
    setResults(calculatedResults);
    setShowResults(true);
    
    // Log user data for lead capture
    console.log('Lead captured:', {
      name: formData.name,
      email: formData.email,
      organization: formData.organization,
      role: formData.role,
      score: calculatedResults.percentage,
      category: calculatedResults.category
    });
    
    // You can integrate with your email marketing platform here
    // Example: sendToEmailPlatform(formData);
  };

  const RatingScale = ({ questionIndex, question }) => (
    <div className="question">
      <h3>{questionIndex + 1}. {question}</h3>
      <div className="rating-scale">
        {[1, 2, 3, 4, 5].map(value => (
          <div key={value} className="rating-option">
            <input
              type="radio"
              id={`q${questionIndex}_${value}`}
              name={`q${questionIndex}`}
              value={value}
              checked={formData.answers[questionIndex] === value}
              onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
              required
            />
            <label htmlFor={`q${questionIndex}_${value}`}>
              {value === 1 ? 'Never' : value === 2 ? 'Rarely' : value === 3 ? 'Sometimes' : value === 4 ? 'Often' : 'Always'}
              <br />({value})
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const Results = ({ results }) => (
    <div className="results">
      <div className="score-display">{results.percentage}%</div>
      <div className="score-text">Your Leadership Score</div>
      
      <div className="recommendations">
        <h3>Your Personalized Leadership Development Plan</h3>
        <h4>Leadership Category: {results.category}</h4>
        <p className="description">{results.description}</p>
        
        <h4>Your Leadership Strengths:</h4>
        <ul>
          {results.recommendations.strengths.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
        
        <h4>{results.percentage >= 85 ? 'Next Steps for Growth:' : 'Areas for Growth:'}</h4>
        <ul>
          {results.recommendations.growth.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        
        <div className="personalized-message">
          <h4>Personalized Message for {formData.name}:</h4>
          <p>
            Based on your current role as {formData.role || 'a professional'} 
            {formData.organization ? ` at ${formData.organization}` : ''}, 
            our Miami Leadership Certification Program can help you advance to the next level. 
            We'll send you a customized development plan to {formData.email}.
          </p>
        </div>
      </div>

      <div className="cta-section">
        <h3>Ready to Take Your Leadership to the Next Level?</h3>
        <p>Join our exclusive Leadership Certification Program in Miami and transform your leadership potential into exceptional results.</p>
        <button 
          className="cta-btn"
          onClick={() => window.location.href = `mailto:info@leadershipcertification.com?subject=Leadership Certification Inquiry&body=Hi, I just completed the leadership scorecard and scored ${results.percentage}%. I'd like to learn more about your Miami certification program.`}
        >
          Get More Information
        </button>
      </div>
    </div>
  );

  if (showResults) {
    return (
      <div className="container">
        <div className="header">
          <h1>Positive Leadership Scorecard</h1>
          <p>Your Results Are Ready!</p>
        </div>
        <div className="content">
          <Results results={results} />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Positive Leadership Scorecard</h1>
        <p>Discover your leadership potential and unlock your path to excellence</p>
      </div>

      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="section">
            <h2>About You</h2>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="organization">Organization/Company</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Current Role/Position</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="section">
            <h2>Leadership Assessment</h2>
            <p className="instruction">Rate each statement on a scale of 1-5, where 1 = Never and 5 = Always</p>
            
            {questions.map((question, index) => (
              <RatingScale 
                key={index} 
                questionIndex={index} 
                question={question} 
              />
            ))}
          </div>

          <button type="submit" className="submit-btn">
            Calculate My Leadership Score
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadershipScorecard;