import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  TimePicker,
  Select,
  Switch,
  Checkbox,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Reminder, ReminderPayload } from "../types/Reminder";
import type { Pet } from "../types/Pet";
import PageLayout from "../layouts/PageLayout";
import {
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
} from "../services/reminderService";
import { getPets } from "../services/petService";
import type { TablePaginationConfig } from "antd/es/table";
import { useAuth } from "../contexts/AuthContext";

const { confirm } = Modal;
const { Option } = Select;

const ReminderPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [spinning, setSpinning] = useState(false);
  const repeatValue = Form.useWatch("repeat", form);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [googleTokensAvailable, setGoogleTokensAvailable] = useState(false);
  const [googleAuthModalVisible, setGoogleAuthModalVisible] = useState(false);
  const { user } = useAuth();

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setSpinning(true);
      const reminderRes = await getReminders({ page, limit: pageSize });
      const petRes = await getPets();

      const data = reminderRes?.data;

      setReminders(data?.reminders || []);
      setPagination({
        current: data?.page || page,
        pageSize: data?.limit || pageSize,
        total: data?.totalItems || 0,
      });
      setPets(petRes?.data?.pets || []);
    } catch (err) {
      messageApi.error("Error when getting data");
    } finally {
      setSpinning(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = reminders?.filter((r) =>
      (r.time?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
    setFilteredReminders(filtered);
  }, [searchQuery, reminders]);

  useEffect(() => {
    if (isModalVisible) {
      if (currentReminder) {
        form.setFieldsValue({
          pet: currentReminder.pet?._id || currentReminder.pet,
          time: dayjs(currentReminder.time, "HH:mm"),
          repeat: currentReminder.repeat,
          customDays: currentReminder.customDays,
          isActive: currentReminder.isActive,
          syncWithGoogle: currentReminder.syncWithGoogle,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalVisible, currentReminder, form]);

  useEffect(() => {
    fetch("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
        .then((res) => res.json())
        .then((res) => {
          const tokens = res?.data?.googleTokens;
          setGoogleTokensAvailable(!!tokens?.access_token);
          console.log("🎯 googleTokens:", tokens);
        });
  }, []);


  const handleTableChange = (pagination: TablePaginationConfig) => {
    fetchData(pagination.current || 1, pagination.pageSize || 10);
  };


  const handleAddReminder = () => {
    setCurrentReminder(null);
    setIsModalVisible(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setCurrentReminder(reminder);
    setIsModalVisible(true);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    confirm({
      title: "Do you want to delete reminder?",
      content: `Pet: ${
          reminder.pet && typeof reminder.pet === "object"
              ? reminder.pet.name
              : reminder.pet ?? "Unknown"
      }, Time: ${reminder.time}`,

      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteReminder(reminder._id);
          messageApi.success("Delete reminder successfully");
          fetchData(pagination.current, pagination.pageSize);
        } catch (err) {
          messageApi.error("Error when deleting");
        }
      },
    });
  };

  const handleSaveReminder = async (values: any) => {
    if (!values.time || !values.time.isValid?.()) {
      messageApi.error("Invalid or missing time value");
      return;
    }
    const fullData: ReminderPayload = {
      pet: values.pet,
      time: values.time.format("HH:mm"),
      repeat: values.repeat,
      customDays: values.customDays,
      isActive: values.isActive ?? true,
      syncWithGoogle: values.syncWithGoogle ?? false,
    };

    try {
      if (currentReminder) {
        await updateReminder(currentReminder._id, fullData);
        messageApi.success("Update successfully");
        setIsModalVisible(false);
        fetchData(pagination.current, pagination.pageSize);
      } else {
        const res = await createReminder(fullData);
        messageApi.success("Created successfully");
        setIsModalVisible(false);

        const newReminder = res?.data || res;
        setReminders((prev) => [...prev, newReminder]);
      }

    } catch (err) {
      messageApi.error("Error when saving");
    }
  };

  return (
    <PageLayout selectedKey="/reminders">
      {contextHolder}
      <Spin spinning={spinning} fullscreen />
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Seach pet or time"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
            rowKey="_id"
            dataSource={filteredReminders}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
            columns={[
              {
                title: "Pet",
                dataIndex: "pet",
                render: (pet) => {
                  if (!pet) return "-";
                  return typeof pet === "object" ? pet.name : pet;
                },
              },
              {
                title: "Time",
                dataIndex: "time",
                render: (time) => dayjs(time, "HH:mm").format("HH:mm"),
              },
              {
                title: "Repeat",
                dataIndex: "repeat",
                render: (val) => {
                  switch (val) {
                    case "daily":
                      return "Daily";
                    case "weekly":
                      return "Weekly";
                    case "custom":
                      return "Options";
                    default:
                      return "Không";
                  }
                },
              },
              {
                title: "Status",
                dataIndex: "isActive",
                render: (val) => (val ? "✔️" : "❌"),
              },
              {
                title: "Action",
                render: (_, record) => (
                    <div style={{ display: "flex", gap: 4 }}>
                      <Button type="link" onClick={() => handleEditReminder(record)}>
                        Edit
                      </Button>
                      <Button
                          danger
                          type="link"
                          onClick={() => handleDeleteReminder(record)}
                      >
                        Delete
                      </Button>
                    </div>
                ),
              },
            ]}
        />

        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddReminder}
          style={{ position: "fixed", bottom: 24, right: 24 }}
        />
        <Modal
            title="Google Synchronization"
            open={googleAuthModalVisible}
            onCancel={() => setGoogleAuthModalVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setGoogleAuthModalVisible(false)}>
                Cancel
              </Button>,
              <Button
                  type="primary"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token || !user?.id) {
                      message.error("You're not logged in");
                      return;
                    }
                    window.location.href = `http://localhost:5000/api/auth/google?linkTo=${user.id}`;
                  }}
              >
                Login via Google
              </Button>

              ,
            ]}
        >
          <p>
            To enable sync with Google Calendar, you must sign in with Google.
          </p>
        </Modal>

        <Modal
          title={currentReminder ? "Update reminder" : "Create reminder"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSaveReminder}>
            <Form.Item
              name="pet"
              label="Pet"
              rules={[{ required: true, message: "Choose pet" }]}
            >
              <Select placeholder="Choose pet">
                {pets?.map((pet) => (
                  <Option key={pet._id} value={pet._id}>
                    {pet.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
                name="time"
                label="Time"
                rules={[{ required: true, message: "Please choose time" }]}
            >
              <TimePicker
                  format="HH:mm"
                  allowClear={false}
                  popupClassName="rounded-md shadow-md"
                  style={{ width: '100%' }}

              />
            </Form.Item>


            <Form.Item name="repeat" label="Repeat">
              <Select placeholder="Choose repeat mode">
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </Form.Item>

            {repeatValue === "custom" && (
              <Form.Item name="customDays" label="Select days">
                <Checkbox.Group
                  options={[
                    { label: "Sun", value: 0 },
                    { label: "Mon", value: 1 },
                    { label: "Tues", value: 2 },
                    { label: "Wed", value: 3 },
                    { label: "Thurs", value: 4 },
                    { label: "Fri", value: 5 },
                    { label: "Sat", value: 6 },
                  ]}
                />
              </Form.Item>
            )}

            <Form.Item
              name="isActive"
              label="Activate"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
                name="syncWithGoogle"
                label="Google Sync"
                valuePropName="checked"
            >
              <Switch
                  onChange={(checked) => {
                    const access = googleTokensAvailable;
                    if (checked && !access) {
                      setGoogleAuthModalVisible(true);
                      setTimeout(() => {
                        form.setFieldValue("syncWithGoogle", false);
                      }, 0);
                    }
                  }}

              />
            </Form.Item>


            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {currentReminder ? "Update" : "Create new"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default ReminderPage;
