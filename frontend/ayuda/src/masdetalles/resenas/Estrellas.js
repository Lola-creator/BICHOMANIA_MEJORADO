import React from "react";

export default function StarRating({ rating, setRating }) {
  return (
    <div style={{ fontSize: "26px", cursor: "pointer", margin: "8px 0" }}>
      {[1, 2, 3, 4, 5].map(num => (
        <span
          key={num}
          onClick={() => setRating(num)}
          style={{
            color: num <= rating ? "gold" : "lightgray",
            marginRight: "5px"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
