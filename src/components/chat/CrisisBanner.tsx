"use client";

import { AlertTriangle, X, Phone } from "lucide-react";
import { CRISIS_HOTLINES } from "@/lib/ai/crisis-detector";

interface Props {
  keywords: string[];
  onDismiss: () => void;
}

export default function CrisisBanner({ keywords, onDismiss }: Props) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              我们注意到你正在经历非常困难的时刻。
            </p>
            <p className="text-sm text-amber-700 mt-1">
              你不需要一个人面对。以下是专业、免费的求助资源：
            </p>
            <div className="mt-2 space-y-1">
              {CRISIS_HOTLINES.map((hotline) => (
                <div
                  key={hotline.number}
                  className="flex items-center gap-2 text-sm text-amber-800"
                >
                  <Phone size={14} className="shrink-0" />
                  <span className="font-medium">{hotline.name}</span>
                  <span className="tabular-nums">{hotline.number}</span>
                  {hotline.note && (
                    <span className="text-amber-600">（{hotline.note}）</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
