// DevicePage.tsx

import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Col,
  Row,
  InputNumber,
  Switch,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PageLayout from "../layouts/PageLayout";
import { Device } from "../types/Device";
import { ColumnsType } from "antd/es/table";
import useMessage from "antd/es/message/useMessage";
import {
  createDevice,
  deleteDevice,
  getDevices,
  updateDevice,
} from "../services/deviceService";
import dayjs from "dayjs";

const { confirm } = Modal;

const DeviceFormFields: React.FC = () => {
  const form = Form.useFormInstance();

  return (
      <>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
                name="serialNumber"
                label="Serial Number"
                rules={[{ required: true, message: "Please enter serial number" }]}
            >
              <Input placeholder="Device serial number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="isActive" label="Activate" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="lastSynced" label="Last sync">
              <Input placeholder="Last sync date (optional)" />
            </Form.Item>
          </Col>
        </Row>
      </>
  );
};

const DevicePage: React.FC = () => {
  const [spinning, setSpinning] = React.useState(false);

  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    const filtered = devices.filter((device) => {
      const serial = device?.serialNumber ?? "";
      return serial.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredDevices(filtered);
  }, [searchQuery, devices]);

  useEffect(() => {
    if (isModalVisible) {
      if (currentDevice) {
        form.setFieldsValue(currentDevice);
      } else {
        form.resetFields();
      }
    }
  }, [isModalVisible, currentDevice, form]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setSpinning(true);
      const data = await getDevices();

      setDevices(data?.data || []);
      setFilteredDevices(data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data?.data?.length || 0,
      }));
    } catch (error) {
      messageApi.error("Error when getting data");
    } finally {
      setSpinning(false);
    }
  };


  console.log(devices);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddDevice = () => {
    setCurrentDevice(null);
    setIsModalVisible(true);
  };

  const handleEditDevice = (device: Device) => {
    setCurrentDevice(device);
    setIsModalVisible(true);
  };

  const handleDeleteWithConfirm = (device: Device) => {
    confirm({
      title: "Do you want to delete this device ?",
      content: device.serialNumber,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await deleteDevice(device._id);
          messageApi.success("Delete device successfully");
          fetchDevices();
        } catch (error) {
          messageApi.error("Device is attached with pet");
        }
      },

    });
  };

  const handleSaveDevice = async (values: any) => {
    const dataToSave: Device = { ...values };

    try {
      if (currentDevice) {
        await updateDevice(currentDevice._id, dataToSave);
        messageApi.success("Update device successfully");
      } else {
        await createDevice(dataToSave);
        messageApi.success("Create device successfully!");
      }
      await fetchDevices();
    } catch (error) {
      messageApi.error("Error when saving device");
    }

    setIsModalVisible(false);
  };


  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns: ColumnsType<Device> = [
    { title: "Serial Number", dataIndex: "serialNumber", key: "serialNumber" },
    {
      title: "Status",
      key: "isActive",
      render: (_, record: Device) => (
          <span>{record?.isActive ? "Active" : "Unactive"}</span>
      ),
    },
    {
      title: "Last Synced",
      key: "lastSynced",
      render: (_, record: Device) => (
          <span>{dayjs(record.lastSynced).format("DD/MM/YYYY HH:mm")}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record: Device) => (
          <div style={{ display: "flex", gap: "4px" }}>
            <Button type="link" onClick={() => handleEditDevice(record)}>
              Edit
            </Button>
            <Button
                type="link"
                danger
                onClick={() => handleDeleteWithConfirm(record)}
            >
              Delete
            </Button>
          </div>
      ),
    },
  ];

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };



  return (
      <PageLayout selectedKey="/devices">
        {contextHolder}
        <Spin spinning={spinning} percent="auto" fullscreen />

        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 16 }}>
            <Input
                placeholder="Search device"
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ width: 300 }}
            />
          </div>

          <Table
              columns={columns}
              dataSource={filteredDevices}
              rowKey="_id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={handleTableChange}
              style={{ marginBottom: 24 }}
          />


          <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleAddDevice}
              style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}
          />

          <Modal
              title={currentDevice ? "Update" : "Create"}
              open={isModalVisible}
              onCancel={handleCancel}
              footer={null}
              destroyOnClose
              forceRender
          >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveDevice}
                initialValues={{ isActive: false }}
            >

              <DeviceFormFields />
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  {currentDevice ? "Update" : "Create"}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </PageLayout>
  );
};

export default DevicePage;
