import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CompatibilityReport.css';

interface CompatibilityReportProps {
  matchId: string;
  userId: string;
  onClose: () => void;
}

interface ReportData {
  personalityAnalysis?: {
    personalityMatch: number;
    sharedValues: string[];
    matchInsight: string;
  };
  visualCompatibility?: {
    score: number;
    insights: string[];
  };
  chatCompatibility?: {
    compatibility: number;
    insights: string[];
    analysis: {
      responseTime: { pattern: string };
      emotionalTone: { overallTone: string };
      conversationBalance: { isBalanced: boolean };
    };
  };
  status?: string;
}

const CompatibilityReport: React.FC<CompatibilityReportProps> = ({ matchId, userId, onClose }) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [userId]);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/matches/insights/${userId}`);
      
      if (response.data.insights.status === 'processing') {
        setIsProcessing(true);
        // Poll for results
        setTimeout(fetchReport, 5000);
      } else {
        setReport(response.data.insights);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error fetching compatibility report:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestChatAnalysis = async () => {
    try {
      await axios.post(`http://localhost:5000/api/matches/compatibility-report/${matchId}`);
      alert('Chat analysis started! Check back in a few minutes.');
      setTimeout(fetchReport, 10000);
    } catch (error) {
      console.error('Error requesting chat analysis:', error);
    }
  };

  if (loading) {
    return (
      <div className="report-modal">
        <div className="report-content">
          <div className="loading">Analyzing compatibility...</div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="report-modal">
        <div className="report-content">
          <h2>🤖 AI Analysis in Progress</h2>
          <div className="processing">
            <div className="spinner"></div>
            <p>Our AI is analyzing your compatibility...</p>
            <p className="estimate">This usually takes 2-3 minutes</p>
          </div>
          <button onClick={onClose}>Check Back Later</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-modal" onClick={onClose}>
      <div className="report-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>AI Compatibility Report</h2>

        {report?.personalityAnalysis && (
          <div className="report-section">
            <h3>🧠 Personality Analysis</h3>
            <div className="score-circle">
              <div className="score">{report.personalityAnalysis.personalityMatch}%</div>
              <div className="label">Personality Match</div>
            </div>
            
            {report.personalityAnalysis.sharedValues.length > 0 && (
              <div className="shared-values">
                <h4>Shared Values:</h4>
                <div className="value-tags">
                  {report.personalityAnalysis.sharedValues.map((value, idx) => (
                    <span key={idx} className="value-tag">{value}</span>
                  ))}
                </div>
              </div>
            )}
            
            <p className="insight">{report.personalityAnalysis.matchInsight}</p>
          </div>
        )}

        {report?.visualCompatibility && (
          <div className="report-section">
            <h3>📸 Lifestyle Compatibility</h3>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${report.visualCompatibility.score * 100}%` }}
              />
            </div>
            <div className="insights-list">
              {report.visualCompatibility.insights.map((insight, idx) => (
                <p key={idx} className="lifestyle-insight">• {insight}</p>
              ))}
            </div>
          </div>
        )}

        {report?.chatCompatibility ? (
          <div className="report-section">
            <h3>💬 Communication Analysis</h3>
            <div className="score-circle">
              <div className="score">{report.chatCompatibility.compatibility}%</div>
              <div className="label">Chat Compatibility</div>
            </div>
            
            <div className="chat-metrics">
              <div className="metric">
                <span className="metric-label">Response Style:</span>
                <span className="metric-value">{report.chatCompatibility.analysis.responseTime.pattern}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Conversation Tone:</span>
                <span className="metric-value">{report.chatCompatibility.analysis.emotionalTone.overallTone}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Balance:</span>
                <span className="metric-value">
                  {report.chatCompatibility.analysis.conversationBalance.isBalanced ? 'Well-balanced' : 'One-sided'}
                </span>
              </div>
            </div>
            
            <div className="insights-list">
              {report.chatCompatibility.insights.map((insight, idx) => (
                <p key={idx} className="chat-insight">• {insight}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="report-section">
            <h3>💬 Communication Analysis</h3>
            <p className="no-data">Not enough chat data yet</p>
            <button onClick={requestChatAnalysis} className="request-analysis-btn">
              Request Chat Analysis
            </button>
            <p className="analysis-note">Need at least 20 messages for analysis</p>
          </div>
        )}

        <div className="report-footer">
          <p className="premium-note">
            🌟 This AI-powered analysis is a premium feature
          </p>
          <button onClick={onClose} className="close-button">Close Report</button>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityReport;