import { api } from "./api";
import type { SelectionTask, PickupTask, DeliveryTask } from "../types/order";

export async function getSelectionTasks(): Promise<SelectionTask[]> {
  const { data } = await api.get<SelectionTask[]>("/tasks/selection");
  return data;
}

export async function getPickupTasks(): Promise<PickupTask[]> {
  const { data } = await api.get<PickupTask[]>("/tasks/pickup");
  return data;
}

export async function getDeliveryTasks(): Promise<DeliveryTask[]> {
  const { data } = await api.get<DeliveryTask[]>("/tasks/delivery");
  return data;
}

export async function updateSelectionTask(id: number, body: Record<string, unknown>): Promise<SelectionTask> {
  const { data } = await api.patch<SelectionTask>(`/tasks/selection/${id}`, body);
  return data;
}

export async function updatePickupTask(id: number, body: Record<string, unknown>): Promise<PickupTask> {
  const { data } = await api.patch<PickupTask>(`/tasks/pickup/${id}`, body);
  return data;
}

export async function updateDeliveryTask(id: number, body: Record<string, unknown>): Promise<DeliveryTask> {
  const { data } = await api.patch<DeliveryTask>(`/tasks/delivery/${id}`, body);
  return data;
}
