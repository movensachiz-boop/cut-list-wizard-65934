import { useEffect, useState } from "react";

const verses = [
  "I can do all things through Christ who strengthens me. - Philippians 4:13",
  "Trust in the LORD with all your heart and lean not on your own understanding. - Proverbs 3:5",
  "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go. - Joshua 1:9",
  "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future. - Jeremiah 29:11",
  "The LORD is my strength and my shield; my heart trusts in him, and he helps me. - Psalm 28:7",
  "Commit to the LORD whatever you do, and he will establish your plans. - Proverbs 16:3",
  "Whatever you do, work at it with all your heart, as working for the Lord, not for human beings. - Colossians 3:23",
  "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you. - Psalm 32:8",
  "The LORD will fight for you; you need only to be still. - Exodus 14:14",
  "But those who hope in the LORD will renew their strength. They will soar on wings like eagles. - Isaiah 40:31",
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
