// components/ui/toast.ts
import React from 'react';

export type ToastProps = {
  message: string;
};

export function ToastActionElement({ message }: ToastProps) {
  return <div>{message}</div>;
}
