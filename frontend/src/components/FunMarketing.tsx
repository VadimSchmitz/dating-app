import React, { useState, useEffect } from 'react';
import '../styles/FunMarketing.css';

const FunMarketing: React.FC = () => {
  const [viralMoment, setViralMoment] = useState('');
  const [memeTemplates, setMemeTemplates] = useState<any[]>([]);
  const [shareScore, setShareScore] = useState(0);
  const [friendsInvited, setFriendsInvited] = useState(0);

  const viralMoments = [
    "When you and your match's kitties dance together for the first time 🐱💕",
    "That moment when you both feed the virtual pet at the same time :3",
    "POV: Your match sends you a bubble message full of hearts 💗",
    "Me explaining to my friends why I need to check on my virtual kitty",
    "The face you make when you get a Super Like during a foam party 🎉",
    "When the algorithm matches you with someone who also names their pet 'Mr. Whiskers'"
  ];

  const memeIdeas = [
    { template: "Drake Meme", top: "Dating apps that just swipe", bottom: "Dating apps with KITTY DANCE PARTIES" },
    { template: "Distracted Boyfriend", text1: "Regular dating", text2: "Me", text3: "Co-Creation Dating with virtual pets" },
    { template: "This is Fine", text: "Me pretending I'm not obsessed with my match's virtual kitty" },
    { template: "Expanding Brain", stages: ["Swiping", "Matching", "Chatting", "CO-CREATING A VIRTUAL PET EMPIRE"] }
  ];

  const shareFunMoment = () => {
    const moment = viralMoments[Math.floor(Math.random() * viralMoments.length)];
    setViralMoment(moment);
    setShareScore(shareScore + 100);
    
    // Simulate going viral
    setTimeout(() => {
      setShareScore(prev => prev + Math.floor(Math.random() * 1000));
    }, 1000);
  };

  const createMeme = (template: any) => {
    // This would open a meme creator
    console.log('Creating meme with:', template);
    setShareScore(shareScore + 500);
  };

  const inviteFriend = () => {
    const messages = [
      "BESTIE! There's an app where you raise KITTIES with your matches! 😻",
      "omg you NEED to see this - dating but with VIRTUAL PETS and DANCE PARTIES",
      "forget everything you know about dating apps... this one has FOAM PARTIES 🫧",
      "hey wanna join a dating app where everyone is just playing with virtual cats? :3"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    // This would share the message
    console.log('Sharing:', message);
    setFriendsInvited(friendsInvited + 1);
    setShareScore(shareScore + 250);
  };

  return (
    <div className="fun-marketing-container">
      <h1>🎉 Spread the Joy! 🎉</h1>
      
      <div className="viral-section">
        <h2>Create Viral Moments!</h2>
        <button onClick={shareFunMoment} className="viral-btn">
          ✨ Generate Shareable Moment ✨
        </button>
        
        {viralMoment && (
          <div className="viral-moment">
            <p>{viralMoment}</p>
            <div className="share-buttons">
              <button className="share-btn">📱 Share to Stories</button>
              <button className="share-btn">🐦 Tweet This</button>
              <button className="share-btn">📸 Create Video</button>
            </div>
          </div>
        )}
      </div>

      <div className="meme-creator">
        <h2>Meme Generator! 🎨</h2>
        <div className="meme-templates">
          {memeIdeas.map((meme, i) => (
            <div key={i} className="meme-card" onClick={() => createMeme(meme)}>
              <h3>{meme.template}</h3>
              <p>Click to create!</p>
            </div>
          ))}
        </div>
      </div>

      <div className="friend-invites">
        <h2>Invite Your Squad! 👯‍♀️</h2>
        <button onClick={inviteFriend} className="invite-btn">
          Send Chaotic Invite Message
        </button>
        <p>Friends invited: {friendsInvited}</p>
        <div className="rewards">
          <p>Get rewards for each friend:</p>
          <ul>
            <li>🎀 Special kitty accessories</li>
            <li>🎉 Exclusive dance moves</li>
            <li>💎 Bonus coins</li>
            <li>🌈 Rainbow effects</li>
          </ul>
        </div>
      </div>

      <div className="share-score">
        <h2>Your Viral Score: {shareScore} 🔥</h2>
        <div className="achievements">
          {shareScore > 100 && <span className="achievement">😊 Joy Spreader</span>}
          {shareScore > 500 && <span className="achievement">🎉 Party Starter</span>}
          {shareScore > 1000 && <span className="achievement">🌟 Viral Sensation</span>}
          {shareScore > 5000 && <span className="achievement">👑 Meme Lord</span>}
        </div>
      </div>

      <div className="community-challenges">
        <h2>Community Challenges! 🏆</h2>
        <div className="challenge-card">
          <h3>This Week: Kitty Fashion Show! 👗</h3>
          <p>Dress up your virtual pets and share screenshots!</p>
          <p>Prize: Exclusive "Catwalk Champion" badge</p>
        </div>
        <div className="challenge-card">
          <h3>Dance-Off Competition! 💃</h3>
          <p>Record your kitties' best dance moves</p>
          <p>Most likes wins a GOLDEN DISCO BALL accessory!</p>
        </div>
      </div>

      <div className="testimonials">
        <h2>What People Are Saying:</h2>
        <div className="testimonial">
          "I came for the dating, stayed for the kitty dance parties" - Sarah, 24
        </div>
        <div className="testimonial">
          "My virtual pet has a better social life than me and I'm not mad" - Mike, 27
        </div>
        <div className="testimonial">
          "We named our real cat after our virtual pet :3" - Emma & Alex, matched 2023
        </div>
      </div>
    </div>
  );
};

export default FunMarketing;