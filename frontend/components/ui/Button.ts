import React from "react";
// Re-export the existing JS Button with a lightweight TypeScript type to satisfy TSX usage
// This avoids type errors in TS files while keeping the implementation in Button.jsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JS module without types; explicitly target .jsx to avoid self-import resolution
import ButtonImpl from "./Button.jsx";

const Button = ButtonImpl as unknown as React.ComponentType<any>;
export default Button;
