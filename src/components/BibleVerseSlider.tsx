import { useEffect, useState } from "react";

const verses = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "It does not matter how slowly you go as long as you do not stop. - Confucius",
  "Everything you've ever wanted is on the other side of fear. - George Addair",
  "Success is not how high you have climbed, but how you make a positive difference to the world. - Roy T. Bennett",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "In the middle of every difficulty lies opportunity. - Albert Einstein",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
  "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream it. Believe it. Build it.",
  "Your passion is waiting for your courage to catch up.",
  "Magic is believing in yourself. If you can make that happen, you can make anything happen.",
  "If something is important enough, even if the odds are stacked against you, you should still do it.",
  "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
  "People who are crazy enough to think they can change the world, are the ones who do. - Rob Siltanen",
  "Failure will never overtake me if my determination to succeed is strong enough. - Og Mandino",
  "We may encounter many defeats but we must not be defeated. - Maya Angelou",
  "Knowing is not enough; we must apply. Wishing is not enough; we must do. - Johann Wolfgang Von Goethe",
  "Whether you think you can or you think you can't, you're right. - Henry Ford",
  "The man who has confidence in himself gains the confidence of others. - Hasidic Proverb",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "Creativity is intelligence having fun. - Albert Einstein",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "I have learned over the years that when one's mind is made up, this diminishes fear. - Rosa Parks",
  "The most difficult thing is the decision to act, the rest is merely tenacity. - Amelia Earhart",
  "Life is 10% what happens to me and 90% of how I react to it. - Charles Swindoll",
  "The most common way people give up their power is by thinking they don't have any. - Alice Walker",
  "The mind is everything. What you think you become. - Buddha",
  "Whenever you see a successful person, you only see the public glories, never the private sacrifices to reach them. - Vaibhav Shah",
  "Opportunities don't happen. You create them. - Chris Grosser",
  "Try not to become a person of success, but rather try to become a person of value. - Albert Einstein",
  "It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change. - Charles Darwin",
  "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
  "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
  "Don't be distracted by criticism. Remember—the only taste of success some people get is to take a bite out of you.",
  "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
  "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you. - Steve Jobs",
  "Experience is a hard teacher because she gives the test first, the lesson afterwards. - Vernon Sanders Law",
  "To know how much there is to know is the beginning of learning to live. - Dorothy West",
  "Goal setting is the secret to a compelling future. - Tony Robbins",
  "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus. - Alexander Graham Bell",
  "Either you run the day or the day runs you. - Jim Rohn",
  "I'm convinced that about half of what separates successful entrepreneurs from the non-successful ones is pure perseverance. - Steve Jobs",
  "There are two types of people who will tell you that you cannot make a difference in this world: those who are afraid to try and those who are afraid you will succeed. - Ray Goforth",
  "Thinking should become your capital asset, no matter whatever ups and downs you come across in your life. - A.P.J. Abdul Kalam",
  "I find that when you have a real interest in life and a curious life, that sleep is not the most important thing. - Martha Stewart",
  "It's not what you look at that matters, it's what you see. - Henry David Thoreau",
  "The road to success and the road to failure are almost exactly the same. - Colin R. Davis",
  "The function of leadership is to produce more leaders, not more followers. - Ralph Nader",
  "Success is liking yourself, liking what you do, and liking how you do it. - Maya Angelou",
  "As we look ahead into the next century, leaders will be those who empower others. - Bill Gates",
  "If you really look closely, most overnight successes took a long time. - Steve Jobs",
  "The only way to discover the limits of the possible is to go beyond them into the impossible. - Arthur C. Clarke",
  "Don't let yesterday take up too much of today. - Will Rogers",
  "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
  "If you are working on something exciting that you really care about, you don't have to be pushed. The vision pulls you. - Steve Jobs",
  "The secret of success is to do the common thing uncommonly well. - John D. Rockefeller Jr.",
  "I never dreamed about success, I worked for it. - Estee Lauder",
  "Success seems to be connected with action. Successful people keep moving. They make mistakes, but they don't quit. - Conrad Hilton",
  "There are no secrets to success. It is the result of preparation, hard work, and learning from failure. - Colin Powell",
  "The real test is not whether you avoid this failure, because you won't. It's whether you let it harden or shame you into inaction, or whether you learn from it. - Barack Obama",
  "The only place where success comes before work is in the dictionary. - Vidal Sassoon",
  "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
  "All progress takes place outside the comfort zone. - Michael John Bobak",
  "You may be disappointed if you fail, but you are doomed if you don't try. - Beverly Sills",
  "Courage is resistance to fear, mastery of fear, not absence of fear. - Mark Twain",
  "Only put off until tomorrow what you are willing to die having left undone. - Pablo Picasso",
  "We generate fears while we sit. We overcome them by action. - Dr. Henry Link",
  "Whether you think you can or think you can't, you're right. - Henry Ford",
  "Security is mostly a superstition. Life is either a daring adventure or nothing. - Helen Keller",
  "The man who moves a mountain begins by carrying away small stones. - Confucius",
  "Perfection is not attainable, but if we chase perfection we can catch excellence. - Vince Lombardi",
  "Life is not about finding yourself. Life is about creating yourself. - George Bernard Shaw",
  "Nothing in the world can take the place of Persistence. Talent will not; nothing is more common than unsuccessful men with talent. - Calvin Coolidge",
  "The best revenge is massive success. - Frank Sinatra",
  "The distance between insanity and genius is measured only by success. - Bruce Feirstein",
  "Don't be afraid to stand for what you believe in, even if that means standing alone.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "The only person you should try to be better than is the person you were yesterday.",
  "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine. - Roy T. Bennett",
  "I learned that courage was not the absence of fear, but the triumph over it. - Nelson Mandela",
  "There is only one way to avoid criticism: do nothing, say nothing, and be nothing. - Aristotle",
  "Do one thing every day that scares you. - Eleanor Roosevelt",
  "All our dreams can come true if we have the courage to pursue them. - Walt Disney",
  "It always seems impossible until it's done. - Nelson Mandela",
  "Don't downgrade your dream just to fit your reality. Upgrade your conviction to match your destiny.",
  "You are confined only by the walls you build yourself.",
  "The difference between who you are and who you want to be is what you do.",
  "A year from now you may wish you had started today. - Karen Lamb",
];

export const BibleVerseSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % verses.length);
    }, 8000); // Change verse every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 backdrop-blur-sm border-b border-primary/20 overflow-hidden">
      <div className="relative h-10 flex items-center justify-center">
        {verses.map((verse, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center px-4 transition-all duration-1000 ${
              index === currentIndex
                ? "opacity-100 translate-x-0"
                : index === (currentIndex - 1 + verses.length) % verses.length
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            <p className="text-sm text-foreground/80 text-center font-medium italic">
              {verse}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
