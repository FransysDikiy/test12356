import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface Notification {
    _id: string;
    message: string;
    petId: string;
    read: boolean;
    timestamp?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    markAsRead: (index: number) => void;
    clearExpired: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
    return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();

    const loadNotifications = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/notifications", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await res.json();
            setNotifications(
                data.map((n: any) => ({
                    _id: n._id,
                    message: n.message,
                    petId: typeof n.pet === "string" ? n.pet : n.pet?._id,
                    read: n.read,
                    timestamp: new Date(n.createdAt).getTime(),
                }))
            );
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadNotifications();
    }, [user]);

    useEffect(() => {
        const polling = setInterval(() => {
            if (user) {
                loadNotifications();
            }
        }, 5000);
        return () => clearInterval(polling);
    }, [user]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNotifications((prev) =>
                prev.filter((n) => !n.read || Date.now() - (n.timestamp || 0) < 30 * 60 * 1000)
            );
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (index: number) => {
        setNotifications((prev) =>
            prev.map((n, i) =>
                i === index ? { ...n, read: true, timestamp: Date.now() } : n
            )
        );

        const id = notifications[index]?._id;
        if (!id) return;

        try {
            await fetch(`http://localhost:5000/api/notifications/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const clearExpired = async () => {
        setNotifications((prev) =>
            prev.filter((n) => !n.read || Date.now() - (n.timestamp || 0) < 30 * 60 * 1000)
        );
        try {
            await fetch("http://localhost:5000/api/notifications/expired", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
        } catch (err) {
            console.error("Failed to delete expired notifications:", err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, markAsRead, clearExpired }}>
            {children}
        </NotificationContext.Provider>
    );
};

