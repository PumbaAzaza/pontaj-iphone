"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type DayEntry = {
  date: string;
  in1: string;
  out1: string;
  in2: string;
  out2: string;
  travelHours: number;
  reimbursement: number;
  fair: string;
  stand: string;
  lunch: number;
  dinner: number;
  notes: string;
  legacyHours?: number;
};

type Settings = { employeeName: string };
type AppTab = "calendar" | "report" | "settings";

const STORAGE_KEY = "pontaj-iphone-v2";