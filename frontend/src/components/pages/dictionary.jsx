import React, { useState } from "react";
import { ALPHABET_DICT, DIGIT_DICT, WORD_DICT } from "./aslData.jsx";

const MediaRenderer = ({ src, className }) => {
  if (!src) return (
    <div className={`${className} flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl`}>
      No Media
    </div>
  );
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

  const handleCatChange = (key) => {
    setOpenCat(openCat === key ? null : key);
    setSelectedItem(null);
  };

  const activeCategory = dictCategories.find(c => c.key === openCat);

  return (
    <div className="font-fredoka bg-white flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>

      <div className="flex items-center justify-between border-b border-gray-100 px-8 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xl text-gray-400 hover:text-orange-500 transition-colors font-black"
          >
            ←
          </button>
          <h2 className="text-base font-black text-gray-700 uppercase tracking-widest">Dictionary</h2>
        </div>
        <h2 className="text-xl font-medium text-black">
          Browse the <span className="text-orange-500">dictionary</span>
        </h2>
        <div className="w-20" />
      </div>

      <div className="flex gap-6 px-8 py-6 flex-1 min-h-0 w-full max-w-[1400px] mx-auto">

        <div
          className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto pr-2"
          style={{ width: "220px" }}
        >
          {dictCategories.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleCatChange(key)}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl border-2 transition-all text-left shadow-sm flex-shrink-0 ${
                openCat === key
                  ? "bg-orange-50 border-orange-400 text-orange-600"
                  : "bg-gray-50/60 border-gray-100 text-gray-700 hover:border-orange-200 hover:bg-orange-50/30"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest">{label}</span>
              <span className="text-lg opacity-80">{icon}</span>
            </button>
          ))}
        </div>

<div className="flex-1 flex items-start bg-gray-50/40 border border-gray-100 rounded-[28px] p-5 min-w-0 overflow-y-auto h-fit">          {!openCat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-6xl mb-4 animate-bounce">📖</span>
              <h3 className="text-xl font-black text-gray-700 uppercase tracking-wide">Ready to Learn?</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-sm leading-relaxed">
                Select a category on the left to start browsing ASL signs.
              </p>
            </div>

          ) : selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 mb-4 flex-shrink">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-colors"
                >
                  ← Back to {activeCategory?.label}
                </button>
              </div>

<div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-w-sm mx-auto w-full self-start">
  <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tight text-center border-b border-gray-100 pb-4 flex-shrink-0">
                  "{selectedItem.word}"
                </h3>
              <div className="mt-4 rounded-xl overflow-hidden bg-orange-50/50 border border-orange-100 flex items-center justify-center" style={{ maxHeight: "360px" }}>
                  <MediaRenderer src={selectedItem.media} className="w-full h-full" />
                </div>
                {selectedItem.directions && (
                  <div className="bg-orange-50/60 p-4 rounded-xl mt-4 border border-orange-100 text-center flex-shrink-0">
                    <p className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-1">Guide</p>
                    <p className="italic font-medium text-orange-950 text-xs leading-relaxed">
                      "{selectedItem.directions}"
                    </p>
                  </div>
                )}
              </div>
            </div>

          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">
                {activeCategory?.label} — {activeCategory?.items.length} items
              </p>
              <div
                className="flex-1 overflow-y-auto pr-1"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "8px",
                  alignContent: "start",
                }}
              >
                {activeCategory?.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className="border-2 rounded-xl px-2 py-4 flex items-center justify-center transition-all active:scale-95 shadow-sm min-h-[56px] bg-white border-gray-100 text-gray-700 hover:border-orange-400 hover:bg-orange-50/50"
                  >
                    <span className="text-xs font-black uppercase tracking-tight text-center leading-tight">
                      {item.word}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}