/**
 * Gantt Chart Timeline Header
 *
 * Displays the date scale header with two rows:
 * - Primary row: months/weeks depending on zoom
 * - Secondary row: days/weeks depending on zoom
 */

import { useMemo } from "react";
import type { GanttZoomLevel } from "../types";

interface GanttHeaderProps {
  startDate: Date;
  endDate: Date;
  zoom: GanttZoomLevel;
  height: number;
  columnWidth: number;
}

// Russian month names
const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const MONTHS_SHORT_RU = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

export function GanttHeader({
  startDate,
  endDate,
  zoom,
  height,
  columnWidth,
}: GanttHeaderProps) {
  // Generate header cells based on zoom level
  const { primaryCells, secondaryCells } = useMemo(() => {
    const primary: { label: string; width: number; isWeekend?: boolean }[] = [];
    const secondary: { label: string; width: number; isWeekend?: boolean }[] = [];

    if (zoom === "day") {
      // Primary: months, Secondary: days
      const current = new Date(startDate);
      let currentMonth = -1;
      let monthDays = 0;

      while (current <= endDate) {
        const month = current.getMonth();
        const day = current.getDate();
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;

        // Secondary: individual days
        secondary.push({
          label: `${day}`,
          width: columnWidth,
          isWeekend,
        });

        // Track month for primary
        if (month !== currentMonth) {
          if (currentMonth >= 0) {
            primary.push({
              label: `${MONTHS_RU[currentMonth]} ${current.getFullYear()}`,
              width: monthDays * columnWidth,
            });
          }
          currentMonth = month;
          monthDays = 1;
        } else {
          monthDays++;
        }

        current.setDate(current.getDate() + 1);
      }

      // Add last month
      if (monthDays > 0) {
        const lastDate = new Date(endDate);
        primary.push({
          label: `${MONTHS_RU[currentMonth]} ${lastDate.getFullYear()}`,
          width: monthDays * columnWidth,
        });
      }
    } else if (zoom === "week") {
      // Primary: months, Secondary: week numbers
      const current = new Date(startDate);
      // Align to Monday
      const dayOfWeek = current.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      current.setDate(current.getDate() + diff);

      let currentMonth = -1;
      let monthWeeks = 0;

      while (current <= endDate) {
        const month = current.getMonth();
        const weekStart = current.getDate();
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Secondary: week range
        secondary.push({
          label: `${weekStart}-${weekEnd.getDate()} ${MONTHS_SHORT_RU[weekEnd.getMonth()]}`,
          width: columnWidth,
        });

        // Track month for primary
        if (month !== currentMonth) {
          if (currentMonth >= 0) {
            primary.push({
              label: `${MONTHS_RU[currentMonth]} ${current.getFullYear()}`,
              width: monthWeeks * columnWidth,
            });
          }
          currentMonth = month;
          monthWeeks = 1;
        } else {
          monthWeeks++;
        }

        current.setDate(current.getDate() + 7);
      }

      // Add last month
      if (monthWeeks > 0) {
        const lastDate = new Date(endDate);
        primary.push({
          label: `${MONTHS_RU[currentMonth]} ${lastDate.getFullYear()}`,
          width: monthWeeks * columnWidth,
        });
      }
    } else {
      // month zoom
      // Primary: years, Secondary: months
      const current = new Date(startDate);
      current.setDate(1); // Align to first of month

      let currentYear = -1;
      let yearMonths = 0;

      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();

        // Secondary: months
        secondary.push({
          label: MONTHS_SHORT_RU[month],
          width: columnWidth,
        });

        // Track year for primary
        if (year !== currentYear) {
          if (currentYear >= 0) {
            primary.push({
              label: `${currentYear}`,
              width: yearMonths * columnWidth,
            });
          }
          currentYear = year;
          yearMonths = 1;
        } else {
          yearMonths++;
        }

        current.setMonth(current.getMonth() + 1);
      }

      // Add last year
      if (yearMonths > 0) {
        primary.push({
          label: `${currentYear}`,
          width: yearMonths * columnWidth,
        });
      }
    }

    return { primaryCells: primary, secondaryCells: secondary };
  }, [startDate, endDate, zoom, columnWidth]);

  return (
    <div
      className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100"
      style={{ height }}
    >
      {/* Primary row */}
      <div className="flex border-b border-gray-200" style={{ height: height / 2 }}>
        {primaryCells.map((cell, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-r border-gray-200 text-xs font-medium text-gray-700"
            style={{ width: cell.width }}
          >
            {cell.label}
          </div>
        ))}
      </div>

      {/* Secondary row */}
      <div className="flex" style={{ height: height / 2 }}>
        {secondaryCells.map((cell, i) => (
          <div
            key={i}
            className={`flex items-center justify-center border-r border-gray-200 text-xs ${
              cell.isWeekend ? "bg-gray-50 text-gray-400" : "text-gray-600"
            }`}
            style={{ width: cell.width }}
          >
            {cell.label}
          </div>
        ))}
      </div>
    </div>
  );
}
