import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";

export default function EconomicCalendar({ alerts, language, onDateSelect }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or month

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const navigateDate = (direction) => {
    const days = viewMode === "week" ? 7 : 30;
    setSelectedDate(prev => 
      direction === "next" ? addDays(prev, days) : subDays(prev, days)
    );
  };

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getAlertsForDate = (date) => {
    return alerts.filter(alert => isSameDay(new Date(alert.datetime), date));
  };

  const weekDates = getWeekDates();

  return (
    <div className="neumorphic-card p-6 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          {language === "ar" ? "التقويم الاقتصادي" : "Economic Calendar"}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "week" ? "month" : "week")}
            className="neumorphic-button px-3 py-1 rounded-lg text-xs"
          >
            {viewMode === "week" 
              ? (language === "ar" ? "شهر" : "Month")
              : (language === "ar" ? "أسبوع" : "Week")
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateDate("prev")}
          className="neumorphic-button p-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h4 className="font-semibold">
          {format(selectedDate, "MMMM yyyy", {
            locale: language === "ar" ? ar : undefined
          })}
        </h4>
        
        <button
          onClick={() => navigateDate("next")}
          className="neumorphic-button p-2 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week View */}
      <div className="space-y-2">
        {weekDates.map((date) => {
          const dayAlerts = getAlertsForDate(date);
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);
          
          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateSelect(date)}
              className={`neumorphic-raised p-3 rounded-xl cursor-pointer transition-all ${
                isSelected ? 'neumorphic-pressed' : ''
              } ${isToday ? 'border-2 border-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">
                  {format(date, "EEE dd", {
                    locale: language === "ar" ? ar : undefined
                  })}
                </span>
                
                {dayAlerts.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                    {dayAlerts.length}
                  </span>
                )}
              </div>
              
              {/* Events for this day */}
              {dayAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">
                    {format(new Date(alert.datetime), "HH:mm")} - {alert.event_name}
                  </span>
                </div>
              ))}
              
              {dayAlerts.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{dayAlerts.length - 3} {language === "ar" ? "المزيد" : "more"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Events */}
      {getAlertsForDate(selectedDate).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-3">
            {format(selectedDate, "EEEE, MMMM dd", {
              locale: language === "ar" ? ar : undefined
            })}
          </h4>
          
          <div className="space-y-2">
            {getAlertsForDate(selectedDate).map((alert) => (
              <div key={alert.id} className="neumorphic-pressed p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{alert.event_name}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(alert.datetime), "HH:mm")}
                  </span>
                </div>
                {alert.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {alert.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}