import React from "react";
import { Avatar, Button, Dropdown, Menu } from "antd";
import { LogoutOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationProvider";
import "../styles/Navbar.css";
import { useState } from "react";
import type { MenuProps } from "antd";
import UserSettingsModal from "./UserSettingsModal";
import { useNavigate } from "react-router-dom";
import { Badge } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    label: "User",
    key: "user",
    icon: <UserOutlined />,
  },
  {
    label: "Logout",
    key: "logout",
    icon: <LogoutOutlined />,
  },
];

const Navbar: React.FC = () => {
  const [current, setCurrent] = useState("");
  const { logout, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { notifications, markAsRead } = useNotification();
  const navigate = useNavigate();

  const handleNotificationClick = (index: number, petId: string) => {
    markAsRead(index);
    navigate(`/pets?petId=${petId}`);
  };

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key);
    if (e.key === "user") {
      setSettingsOpen(true);
    } else if (e.key === "logout") {
      logout();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
      <header className="navbar">
        <div className="navbar-left">
          <img src="/logo512.png" alt="Logo" className="logo" />
          <h1 className="title">Reminder Pets</h1>
        </div>
        <div className="navbar-right">
          {user && (
              <>
                <div className="notification-wrapper">
                  <Dropdown
                      overlay={
                        <Menu>
                          {notifications.length === 0 ? (
                              <Menu.Item disabled>Nothing to read</Menu.Item>
                          ) : (
                              notifications.map((notification, index) => (
                                  <Menu.Item
                                      key={index}
                                      onClick={() => handleNotificationClick(index, notification.petId)}
                                      style={{ color: notification.read ? "gray" : "black" }}
                                  >
                                    {notification.message}
                                  </Menu.Item>
                              ))
                          )}
                        </Menu>
                      }
                      trigger={["click"]}
                  >
                    <Badge count={unreadCount} size="small">
                      <Button icon={<BellOutlined />} shape="circle" />
                    </Badge>

                  </Dropdown>
                </div>

                <Dropdown
                    menu={{
                      onClick: onClick,
                      selectedKeys: [current],
                      items: items,
                    }}
                    trigger={["hover"]}
                >
                  <div className="avatar-wrapper">
                    <Avatar size={40} icon={<UserOutlined />} className="avatar" />
                    <span className="user-name">{user.email}</span>
                  </div>
                </Dropdown>
              </>
          )}
        </div>

        <UserSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </header>
  );
};

export default Navbar;

