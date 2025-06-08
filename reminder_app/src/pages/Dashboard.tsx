import { useEffect, useState } from "react";
import { Table, Drawer, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ReminderLog } from "../types/ReminderLog";
import { fetchReminderLogs, deleteReminderLog } from "../services/reminderLogService";
import { Modal } from "antd";

const statusColorMap: Record<"notified" | "completed" | "missed", string> = {
  notified: "blue",
  completed: "green",
  missed: "red",
};

export default function ReminderLogsDashboard() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ReminderLog | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const data = await fetchReminderLogs();

        const sorted = data.sort((a, b) =>
            new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime()
        );


        const normalized = sorted.map((log) => {
          const r = typeof log.reminder === "object" ? log.reminder : {};
          return {
            ...log,
            reminder: `${r.pet?.name || "Unknown"} - ${r.time || "No time"}`,
          };
        });


        setLogs(normalized);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        message.error("Failed to load reminder logs");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const columns: ColumnsType<ReminderLog> = [
    {
      title: "Pet / Reminder",
      dataIndex: "reminder",
      key: "reminder",
    },
    {
      title: "ExecutedAt",
      dataIndex: "executedAt",
      key: "executedAt",
      render: (text) =>
          text ? dayjs(text).format("HH:mm - DD/MM/YYYY") : "Not done yet",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
          <Tag color={statusColorMap[record.status]} className="capitalize">
            {record.status}
          </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
          <button
              onClick={(e) => {
                e.stopPropagation();

                Modal.confirm({
                  title: "Confirm delete",
                  content: "Are you sure you want to delete this log?",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  centered: true,
                  onOk: async () => {
                    try {
                      if (!record._id) return;
                      await deleteReminderLog(record._id);
                      setLogs((prev) => prev.filter((log) => log._id !== record._id));
                      message.success("Log deleted");
                    } catch (err) {
                      console.error(err);
                      message.error("Failed to delete log");
                    }
                  },
                });
              }}
              style={{
                background: "#ffecec",
                border: "1px solid #ff4d4f",
                cursor: "pointer",
                color: "#ff4d4f",
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: "bold",
              }}
              title="Delete"
          >
            Delete
          </button>
      ),
    },
  ];


  return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold my-4 mx-2">Reminder Pet History</h1>
        <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="_id"
            onRow={(record) => ({
              onClick: () => setSelectedLog(record),
            })}
            className="cursor-pointer"
        />
        <Drawer
            title="Details"
            open={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            width={400}
        >
          {selectedLog && (
              <div className="space-y-4">
                <p>
                  <>
                    <strong>Pet / Reminder:</strong> {selectedLog.reminder}
                  </>
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <Tag
                      color={statusColorMap[selectedLog.status]}
                      className="capitalize"
                  >
                    {selectedLog.status}
                  </Tag>
                </p>
                <p>
                  <strong>Executed at:</strong>{" "}
                  {selectedLog.executedAt
                      ? dayjs(selectedLog.executedAt).format("HH:mm - DD/MM/YYYY")
                      : "Not done yet"}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {selectedLog.createdAt
                      ? dayjs(selectedLog.createdAt).format("HH:mm - DD/MM/YYYY")
                      : "-"}
                </p>
              </div>
          )}
        </Drawer>
      </div>
  );
}

