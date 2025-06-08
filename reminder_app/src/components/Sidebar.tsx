import React, { useState } from "react";
import {
  ImportOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  HomeOutlined,
  RightSquareOutlined,
  LeftSquareOutlined,
  ProductOutlined,
  ExportOutlined,
  BookFilled,
  BookOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "/",
    label: "Home",
    icon: <HomeOutlined />,
  },
  {
    key: "/reminders",
    label: "Reminder",
    icon: <img src="/notification.png" className=" w-4 h-4"></img>,
  },
  {
    key: "/devices",
    label: "Device",
    icon: <img src="/smart-home.png" className="w-4 h-4"></img>,
  },
  {
    key: "/pets",
    label: "Pet",
    icon: <img src="/animals.png" className="w-4 h-4"></img>,
  },
];

interface SidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  selectedKey: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  toggleCollapsed,
  selectedKey,
}) => {
  const navigate = useNavigate();

  const onClick: MenuProps["onClick"] = (e) => {
    const { key } = e;
    if (typeof key === "string" && key.startsWith("/")) {
      navigate(key);
    }
  };

  return (
    <div className="menu-sidebar">
      <Menu
        onClick={onClick}
        selectedKeys={[selectedKey]}
        mode="inline"
        items={items}
      />
      <Button
        className="collapse-button"
        type="primary"
        onClick={toggleCollapsed}
        style={{ marginBottom: 16 }}
      >
        {collapsed ? <RightSquareOutlined /> : <LeftSquareOutlined />}
      </Button>
    </div>
  );
};

export default Sidebar;
