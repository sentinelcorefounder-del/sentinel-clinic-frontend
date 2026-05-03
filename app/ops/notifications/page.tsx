import NotificationsClient from "./NotificationsClient";
import { serverFetch } from "@/lib/server-api";

export default async function OpsNotificationsPage() {
  const notifications = await serverFetch("/api/ops/notifications/");

  return <NotificationsClient initialNotifications={notifications} />;
}