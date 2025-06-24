import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/PersonalityTest.css';

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'choice' | 'scenario';
  options?: string[];
  trait: string;
}

const PersonalityTest: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [personality, setPersonality] = useState<any>(null);

  const questions: Question[] = [
    {
      id: 1,
      text: "When starting a new project, I prefer to:",
      type: 'choice',
      options: [
        "Jump in and figure it out as I go",
        "Create a detailed plan first",
        "Brainstorm with others before starting",
        "Research similar projects for inspiration"
      ],
      trait: 'approach'
    },
    {
      id: 2,
      text: "How comfortable are you with uncertainty in creative projects?",
      type: 'scale',
      trait: 'openness'
    },
    {
      id: 3,
      text: "You're working on a team project. The deadline is approaching but someone suggests a major change that could make it better. You:",
      type: 'scenario',
      options: [
        "Stick to the plan - deadlines matter most",
        "Quickly evaluate if we can do both",
        "Go for it - quality over deadlines",
        "Put it to a team vote"
      ],
      trait: 'flexibility'
    },
    {
      id: 4,
      text: "How energized do you feel after a long brainstorming session with others?",
      type: 'scale',
      trait: 'extraversion'
    },
    {
      id: 5,
      text: "Your ideal creative environment is:",
      type: 'choice',
      options: [
        "A quiet space where I can focus deeply",
        "A bustling café with background energy",
        "A collaborative workspace with others",
        "Anywhere, as long as I have my tools"
      ],
      trait: 'environment'
    },
    {
      id: 6,
      text: "When receiving feedback on your work, you typically:",
      type: 'choice',
      options: [
        "Welcome all criticism to improve",
        "Feel defensive but try to listen",
        "Focus on the positive comments",
        "Ask lots of clarifying questions"
      ],
      trait: 'growth_mindset'
    },
    {
      id: 7,
      text: "How important is it that your collaborators share your vision exactly?",
      type: 'scale',
      trait: 'collaboration_style'
    },
    {
      id: 8,
      text: "You're most motivated by:",
      type: 'choice',
      options: [
        "Solving complex problems",
        "Creating something beautiful",
        "Helping others succeed",
        "Learning new skills",
        "Making a positive impact"
      ],
      trait: 'motivation'
    },
    {
      id: 9,
      text: "In disagreements about creative direction, you usually:",
      type: 'choice',
      options: [
        "Stand firm on your vision",
        "Find a compromise quickly",
        "Defer to expertise",
        "Experiment with all options"
      ],
      trait: 'conflict_style'
    },
    {
      id: 10,
      text: "How do you prefer to communicate during projects?",
      type: 'choice',
      options: [
        "Quick messages throughout the day",
        "Scheduled video calls",
        "In-person when possible",
        "Asynchronous updates when done"
      ],
      trait: 'communication'
    }
  ];

  const handleAnswer = (answer: any) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculatePersonality();
    }
  };

  const calculatePersonality = async () => {
    // Analyze answers to create personality profile
    const profile = {
      creativeStyle: determineCreativeStyle(),
      collaborationType: determineCollaborationType(),
      communicationPreference: determineCommunicationStyle(),
      strengths: determineStrengths(),
      idealMatches: determineIdealMatches()
    };

    setPersonality(profile);
    setShowResults(true);

    // Save to user profile
    try {
      await axios.put('http://localhost:5000/api/users/personality', {
        personalityProfile: profile,
        testAnswers: answers
      });
    } catch (error) {
      console.error('Error saving personality profile:', error);
    }
  };

  const determineCreativeStyle = () => {
    const approach = answers[1];
    const flexibility = answers[3];
    
    if (approach === 0 && flexibility === 2) return "Innovative Explorer";
    if (approach === 1) return "Strategic Planner";
    if (approach === 2) return "Collaborative Creator";
    return "Adaptive Maker";
  };

  const determineCollaborationType = () => {
    const collab = answers[7];
    const conflict = answers[9];
    
    if (collab < 50 && conflict === 1) return "Flexible Partner";
    if (collab > 70) return "Vision Aligner";
    if (conflict === 3) return "Experimental Collaborator";
    return "Balanced Co-Creator";
  };

  const determineCommunicationStyle = () => {
    const comm = answers[10];
    const energy = answers[4];
    
    if (comm === 0 && energy > 70) return "High-Energy Communicator";
    if (comm === 3) return "Deep Work Focused";
    if (comm === 2) return "In-Person Connector";
    return "Flexible Communicator";
  };

  const determineStrengths = () => {
    const strengths = [];
    if (answers[2] > 70) strengths.push("Embraces uncertainty");
    if (answers[6] === 0) strengths.push("Growth mindset");
    if (answers[8] === 2) strengths.push("People-focused");
    if (answers[8] === 4) strengths.push("Impact-driven");
    return strengths;
  };

  const determineIdealMatches = () => {
    const matches = [];
    
    if (answers[5] === 0) {
      matches.push("Collaborators who respect focus time");
    }
    if (answers[4] < 50) {
      matches.push("Partners who balance your energy");
    }
    if (answers[7] < 50) {
      matches.push("Creative minds who bring new perspectives");
    }
    
    return matches;
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];

    switch (question.type) {
      case 'scale':
        return (
          <div className="scale-question">
            <p>{question.text}</p>
            <div className="scale-container">
              <span>Not at all</span>
              <input
                type="range"
                min="0"
                max="100"
                value={answers[question.id] || 50}
                onChange={(e) => setAnswers({
                  ...answers,
                  [question.id]: parseInt(e.target.value)
                })}
              />
              <span>Extremely</span>
            </div>
            <button 
              className="next-button"
              onClick={() => handleAnswer(answers[question.id] || 50)}
            >
              Next
            </button>
          </div>
        );

      case 'choice':
      case 'scenario':
        return (
          <div className="choice-question">
            <p>{question.text}</p>
            <div className="options">
              {question.options?.map((option, idx) => (
                <button
                  key={idx}
                  className="option-button"
                  onClick={() => handleAnswer(idx)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  if (showResults) {
    return (
      <div className="personality-results">
        <h2>Your Co-Creation Personality Profile</h2>
        
        <div className="profile-card">
          <h3>Creative Style: {personality.creativeStyle}</h3>
          <p>You approach projects with a unique blend of innovation and structure.</p>
        </div>

        <div className="profile-card">
          <h3>Collaboration Type: {personality.collaborationType}</h3>
          <p>Your ideal partnerships involve mutual respect and creative freedom.</p>
        </div>

        <div className="profile-card">
          <h3>Communication: {personality.communicationPreference}</h3>
          <p>You thrive with clear, purposeful communication.</p>
        </div>

        <div className="profile-card">
          <h3>Your Strengths:</h3>
          <ul>
            {personality.strengths.map((strength: string, idx: number) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>

        <div className="profile-card">
          <h3>Ideal Matches:</h3>
          <ul>
            {personality.idealMatches.map((match: string, idx: number) => (
              <li key={idx}>{match}</li>
            ))}
          </ul>
        </div>

        <button 
          className="continue-button"
          onClick={() => navigate('/matches')}
        >
          Find Your Co-Creation Matches
        </button>
      </div>
    );
  }

  return (
    <div className="personality-test-container">
      <div className="test-header">
        <h2>Discover Your Co-Creation Style</h2>
        <p>Question {currentQuestion + 1} of {questions.length}</p>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="question-container">
        {renderQuestion()}
      </div>
    </div>
  );
};

export default PersonalityTest;