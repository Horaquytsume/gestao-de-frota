export function calculateAverage(tripKm, liters) {
  const distance = Number(tripKm);
  const fuel = Number(liters);
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(fuel) || fuel <= 0) {
    throw new RangeError('Distância e litros devem ser números positivos.');
  }
  return Number((distance / fuel).toFixed(2));
}

export function maintenanceStatus(currentKm, lastServiceKm, interval) {
  const current = Number(currentKm);
  const last = Number(lastServiceKm);
  const step = Number(interval);
  if (![current, last, step].every(Number.isFinite) || current < 0 || last < 0 || step <= 0 || last > current) {
    throw new RangeError('Quilometragens e intervalo inválidos.');
  }
  const remaining = last + step - current;
  if (remaining <= 0) return { type: 'overdue', remaining };
  if (remaining <= 1500) return { type: 'soon', remaining };
  return { type: 'ok', remaining };
}
