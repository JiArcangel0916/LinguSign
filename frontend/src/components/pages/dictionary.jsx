import React, { useState } from "react";
import { ALPHABET_DICT, DIGIT_DICT, WORD_DICT } from "./aslData.jsx";

const MediaRenderer = ({ src, className }) => {
  if (!src) return <div className={className}>No Media</div>;
  const isVideo = src.toLowerCase().endsWith(".mp4");
  return isVideo ? (
    <video key={src} autoPlay loop muted playsInline className={`${className} object-cover`}>
      <source src={src} type="video/mp4" />
    </video>
  ) : (
    <img src={src} className={`${className} object-contain p-4`} alt="ASL Sign" />
  );
};

export default function Dictionary({ onBack }) {
  const [openCat, setOpenCat] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const dictCategories = [
    { key: "Alphabet", label: "ALPHABET", icon: "abc", items: ALPHABET_DICT },
    { key: "Digit",    label: "DIGIT",    icon: "123", items: DIGIT_DICT },
    ...WORD_DICT.map((sub) => ({
      key: sub.category,
      label: sub.category.toUpperCase(),
      icon: "💬",
      items: sub.words,
    })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-xl text-gray-400 hover:text-orange-500 transition-colors font-black"
        >
          ←
        </button>
        <h2 className="text-base font-black text-gray-700 uppercase tracking-widest">Dictionary</h2>
      </div>

      {dictCategories.map(({ key, label, icon, items }) => {
        const isOpen = openCat === key;
        return (
          <div key={key}>
            <button
              onClick={() => setOpenCat(isOpen ? null : key)}
              className={`w-full flex justify-between items-center px-6 py-5 rounded-2xl border-2 transition-all ${
                isOpen
                  ? "bg-orange-50 border-orange-300 rounded-b-none border-b-0"
                  : "bg-gray-50 border-gray-50 hover:border-orange-200 hover:bg-orange-50"
              }`}
            >
              <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{label}</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-gray-300 select-none">{icon}</span>
                <span className={`text-xs font-black transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-400" : "text-gray-300"}`}>▼</span>
              </div>
            </button>

            {isOpen && (
              <div className="bg-orange-50 border-2 border-orange-300 border-t-0 rounded-b-2xl px-4 pb-4 pt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border-2 border-orange-100 rounded-xl px-2 py-3 flex items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-all active:scale-95 shadow-sm"
                  >
                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight text-center leading-tight">
                      {item.word}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-[40px] p-10 flex flex-col items-center space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-black text-sm hover:bg-orange-100 hover:text-orange-500 transition-all"
            >
              ✕
            </button>
            <h3 className="text-4xl font-black text-gray-800 italic underline decoration-orange-500 decoration-8 underline-offset-8 uppercase">
              "{selectedItem.word}"
            </h3>
            <div className="w-full aspect-video rounded-[30px] overflow-hidden bg-orange-50 border-4 border-orange-100 shadow-inner flex items-center justify-center">
              <MediaRenderer src={selectedItem.media} className="w-full h-full" />
            </div>
            <div className="bg-orange-50 p-6 rounded-[20px] w-full text-center italic font-bold text-orange-900 text-base border-2 border-orange-100">
              "{selectedItem.directions}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}