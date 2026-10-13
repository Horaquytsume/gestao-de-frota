import { useEffect, useState } from 'react';
import './styles.css';

const HISTORY_KEY = 'carHistory';
const ODOMETER_KEY = 'currentKm';
const MAINTENANCE_KEY = 'carMaintenance';

const maintenanceItems = [
  { name: 'Óleo do motor', interval: 10_000 },
  { name: 'Bucha do trambulador', interval: 40_000 },
  { name: 'Correia de acessórios', interval: 60_000 },
  { name: 'Bomba d’água', interval: 80_000 },
  { name: 'Bieletas da suspensão', interval: 50_000 },
];

function readHistory() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(saved)) return [];

    return saved
      .filter((record) => record && Number.isFinite(Number(record.id))
        && Number.isFinite(Number(record.kmTotal))
        && Number.isFinite(Number(record.tripKm))
        && Number.isFinite(Number(record.liters))
        && Number(record.tripKm) > 0
        && Number(record.liters) > 0)
      .map((record) => ({
        id: Number(record.id),
        date: String(record.date || ''),
        kmTotal: Number(record.kmTotal),
        tripKm: Number(record.tripKm),
        liters: Number(record.liters),
        average: Number(record.average) || Number(record.tripKm) / Number(record.liters),
      }));
  } catch {
    return [];
  }
}

function readOdometer() {
  try {
    const value = Number(window.localStorage.getItem(ODOMETER_KEY) || 0);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function readMaintenance() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(MAINTENANCE_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};

    return Object.fromEntries(
      Object.entries(saved).filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0)
        .map(([name, value]) => [name, Number(value)]),
    );
  } catch {
    return {};
  }
}

function formatKm(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
}

function maintenanceStatus(currentKm, lastServiceKm, interval) {
  if (lastServiceKm === undefined) {
    return {
      type: 'unknown',
      label: 'Informe a última troca',
      detail: 'Cadastre a quilometragem da última manutenção.',
    };
  }

  const nextServiceKm = lastServiceKm + interval;
  const remaining = nextServiceKm - currentKm;

  if (remaining < 0) {
    return {
      type: 'overdue',
      label: 'Manutenção vencida',
      detail: `Atrasada há ${formatKm(Math.abs(remaining))} km · prevista aos ${formatKm(nextServiceKm)} km`,
    };
  }
  if (remaining === 0) {
    return {
      type: 'overdue',
      label: 'Troca vence agora',
      detail: `Manutenção prevista aos ${formatKm(nextServiceKm)} km`,
    };
  }
  if (remaining <= 1_500) {
    return {
      type: 'soon',
      label: 'Troca próxima',
      detail: `Faltam ${formatKm(remaining)} km · prevista aos ${formatKm(nextServiceKm)} km`,
    };
  }
  return {
    type: 'ok',
    label: 'Tudo em dia',
    detail: `Próxima aos ${formatKm(nextServiceKm)} km · faltam ${formatKm(remaining)} km`,
  };
}

export default function CarManagementApp() {
  const [history, setHistory] = useState(readHistory);
  const [currentKm, setCurrentKm] = useState(readOdometer);
  const [lastMaintenance, setLastMaintenance] = useState(readMaintenance);
  const [maintenanceDrafts, setMaintenanceDrafts] = useState({});
  const [inputKmTotal, setInputKmTotal] = useState('');
  const [inputTripKm, setInputTripKm] = useState('');
  const [inputLiters, setInputLiters] = useState('');
  const [formError, setFormError] = useState('');
  const [maintenanceError, setMaintenanceError] = useState('');
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      window.localStorage.setItem(ODOMETER_KEY, String(currentKm));
      window.localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(lastMaintenance));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [history, currentKm, lastMaintenance]);

  function handleAddRecord(event) {
    event.preventDefault();
    setFormError('');

    const kmTotal = Number(inputKmTotal);
    const tripKm = Number(inputTripKm);
    const liters = Number(inputLiters);

    if (inputKmTotal.trim() === '' || !Number.isInteger(kmTotal) || kmTotal < 0) {
      setFormError('Informe uma quilometragem total válida, sem casas decimais.');
      return;
    }
    if (kmTotal < currentKm) {
      setFormError(`O hodômetro não pode diminuir. O último registro foi ${formatKm(currentKm)} km.`);
      return;
    }
    if (inputTripKm.trim() === '' || !Number.isFinite(tripKm) || tripKm <= 0) {
      setFormError('Informe uma distância rodada maior que zero.');
      return;
    }
    if (inputLiters.trim() === '' || !Number.isFinite(liters) || liters <= 0) {
      setFormError('Informe uma quantidade de litros maior que zero.');
      return;
    }

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      kmTotal,
      tripKm,
      liters,
      average: Number((tripKm / liters).toFixed(2)),
    };

    setHistory((previous) => [newRecord, ...previous]);
    setCurrentKm(kmTotal);
    setInputKmTotal('');
    setInputTripKm('');
    setInputLiters('');
  }

  function handleSaveMaintenance(event, part) {
    event.preventDefault();
    setMaintenanceError('');
    const value = maintenanceDrafts[part] ?? '';
    const serviceKm = Number(value);

    if (String(value).trim() === '' || !Number.isInteger(serviceKm) || serviceKm < 0) {
      setMaintenanceError('Informe uma quilometragem válida para a última manutenção.');
      return;
    }
    if (serviceKm > currentKm) {
      setMaintenanceError(`A última manutenção não pode passar do hodômetro atual (${formatKm(currentKm)} km).`);
      return;
    }

    setLastMaintenance((previous) => ({ ...previous, [part]: serviceKm }));
    setMaintenanceError('');
  }

  function markMaintenanceDone(part) {
    if (currentKm <= 0) {
      setMaintenanceError('Registre primeiro a quilometragem atual do veículo.');
      return;
    }
    setLastMaintenance((previous) => ({ ...previous, [part]: currentKm }));
    setMaintenanceDrafts((previous) => ({ ...previous, [part]: String(currentKm) }));
    setMaintenanceError('');
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-icon" aria-hidden="true">🚘</div>
            <div>
              <p className="eyebrow">PAINEL DO VEÍCULO</p>
              <h1>Gestão de Frota</h1>
              <p className="muted">Kia Cerato · abastecimentos e manutenção</p>
            </div>
          </div>
          <div className="odometer-card" aria-label={`Hodômetro atual: ${formatKm(currentKm)} quilômetros`}>
            <span className="odometer-label">Hodômetro atual</span>
            <strong>{formatKm(currentKm)} <small>km</small></strong>
          </div>
        </header>

        {storageError && (
          <div className="alert alert-warning" role="status">
            O navegador não conseguiu salvar os dados. Confira as permissões de armazenamento local.
          </div>
        )}

        <div className="dashboard-grid">
          <div className="left-column">
            <section className="panel" aria-labelledby="fuel-heading">
              <div className="section-heading">
                <span className="section-icon" aria-hidden="true">⛽</span>
                <div>
                  <p className="eyebrow">CONSUMO</p>
                  <h2 id="fuel-heading">Registrar abastecimento</h2>
                </div>
              </div>

              <form className="fuel-form" onSubmit={handleAddRecord} noValidate>
                <label className="field field-full">
                  <span>Quilometragem total no painel</span>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={currentKm}
                      step="1"
                      required
                      value={inputKmTotal}
                      onChange={(event) => setInputKmTotal(event.target.value)}
                      placeholder="Ex.: 125000"
                      aria-describedby="km-help"
                    />
                    <span>km</span>
                  </div>
                  <small id="km-help">Não pode ser menor que o último registro ({formatKm(currentKm)} km).</small>
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Distância rodada</span>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.1"
                        step="0.1"
                        required
                        value={inputTripKm}
                        onChange={(event) => setInputTripKm(event.target.value)}
                        placeholder="450,5"
                      />
                      <span>km</span>
                    </div>
                  </label>
                  <label className="field">
                    <span>Combustível abastecido</span>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.1"
                        step="0.1"
                        required
                        value={inputLiters}
                        onChange={(event) => setInputLiters(event.target.value)}
                        placeholder="40,2"
                      />
                      <span>L</span>
                    </div>
                  </label>
                </div>

                {formError && <p className="alert alert-error" role="alert">{formError}</p>}

                <button className="button button-primary" type="submit">Salvar abastecimento</button>
              </form>
            </section>

            <section className="panel" aria-labelledby="history-heading">
              <div className="section-heading">
                <span className="section-icon" aria-hidden="true">📜</span>
                <div>
                  <p className="eyebrow">REGISTROS</p>
                  <h2 id="history-heading">Histórico de consumo</h2>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="empty-state">
                  <span aria-hidden="true">⛽</span>
                  <p>Nenhum abastecimento registrado ainda.</p>
                  <small>Seu consumo médio aparecerá aqui após o primeiro registro.</small>
                </div>
              ) : (
                <ul className="history-list">
                  {history.slice(0, 5).map((record) => (
                    <li className="history-item" key={record.id}>
                      <div>
                        <strong>{Number(record.average).toFixed(2).replace('.', ',')} km/L</strong>
                        <span>{record.date} · hodômetro {formatKm(record.kmTotal)} km</span>
                      </div>
                      <div className="history-values">
                        <span>{formatKm(record.tripKm)} km</span>
                        <span>{formatKm(record.liters)} L</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="panel maintenance-panel" aria-labelledby="maintenance-heading">
            <div className="section-heading">
              <span className="section-icon" aria-hidden="true">🔧</span>
              <div>
                <p className="eyebrow">PREVENÇÃO</p>
                <h2 id="maintenance-heading">Status de manutenção</h2>
              </div>
            </div>

            <p className="panel-intro">
              Registre a quilometragem da última troca para calcular corretamente a próxima.
            </p>

            <div className="maintenance-list">
              {maintenanceItems.map(({ name, interval }) => {
                const lastServiceKm = lastMaintenance[name];
                const status = maintenanceStatus(currentKm, lastServiceKm, interval);
                const draft = maintenanceDrafts[name] ?? (lastServiceKm === undefined ? '' : String(lastServiceKm));

                return (
                  <article className={`maintenance-card status-${status.type}`} key={name}>
                    <div className="maintenance-card-top">
                      <div>
                        <h3>{name}</h3>
                        <span className="interval-label">Intervalo configurado: {formatKm(interval)} km</span>
                      </div>
                      <span className="status-pill">{status.label}</span>
                    </div>
                    <p className="maintenance-detail">{status.detail}</p>
                    <form className="maintenance-form" onSubmit={(event) => handleSaveMaintenance(event, name)}>
                      <label className="field">
                        <span>Última manutenção aos (km)</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={currentKm}
                          step="1"
                          value={draft}
                          onChange={(event) => setMaintenanceDrafts((previous) => ({ ...previous, [name]: event.target.value }))}
                          placeholder={currentKm > 0 ? `Até ${formatKm(currentKm)} km` : 'Registre o hodômetro primeiro'}
                        />
                      </label>
                      <div className="maintenance-actions">
                        <button className="button button-secondary" type="submit">Salvar km</button>
                        <button className="button button-quiet" type="button" onClick={() => markMaintenanceDone(name)} disabled={currentKm <= 0}>
                          Feita agora
                        </button>
                      </div>
                    </form>
                  </article>
                );
              })}
            </div>

            {maintenanceError && <p className="alert alert-error" role="alert">{maintenanceError}</p>}

            <div className="note-box">
              <span aria-hidden="true">💡</span>
              <p>Os intervalos são referências configuradas no app. Confira o manual e as recomendações do mecânico para o ano e a versão do seu veículo.</p>
            </div>
          </section>
        </div>

        <footer className="app-footer">
          <span>Seus registros ficam salvos neste navegador.</span>
          <span>Gestão de Frota · dados locais</span>
        </footer>
      </div>
    </main>
  );
}
