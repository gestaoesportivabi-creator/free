import { expect, test, type Page } from '@playwright/test';
import {
  COLLECTION_EXPERIENCE_STORAGE_KEY,
  CURRENT_COLLECTION_EXPERIENCE,
  SHELL_COLLECTION_EXPERIENCE,
  clearStoredCollectionExperience,
  getExperienceActivationRequest,
  getStoredCollectionExperience,
  resolveCollectionExperience,
  setStoredCollectionExperience,
} from '../../utils/collectionExperience';
import {
  abrirDadosDoJogo,
  abrirLogs,
  abrirPartidaQa,
  contarEventosLog,
  fecharLogs,
  iniciarColeta,
  loginComoQa,
  normalizarPartidaQaEmTempoReal,
  salvarPartida,
} from '../helpers/scout-flow';

type MemoryWindow = Window & {
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

function installMemoryWindow(seed?: Record<string, string>) {
  const previousWindow = (globalThis as { window?: Window }).window;
  const bucket = new Map<string, string>(Object.entries(seed ?? {}));

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => bucket.get(key) ?? null,
        setItem: (key: string, value: string) => {
          bucket.set(key, value);
        },
        removeItem: (key: string) => {
          bucket.delete(key);
        },
      },
    } as MemoryWindow,
  });

  return () => {
    if (previousWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
      return;
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    });
  };
}

async function abrirConfiguracoes(page: Page): Promise<void> {
  await page.getByTestId('nav-settings').click();
  await expect(page.getByTestId('collection-experience-selector')).toBeVisible();
}

async function selecionarExperiencia(
  page: Page,
  experience: 'current' | 'shell'
): Promise<void> {
  await page.getByTestId(`collection-experience-${experience}`).click();
  await expect(page.getByTestId('collection-experience-feedback')).toContainText(
    'A nova experiencia sera aplicada ao abrir a proxima coleta'
  );
}

async function abrirColetaQaPelaNavegacaoNormal(page: Page): Promise<void> {
  await abrirDadosDoJogo(page);
  await abrirPartidaQa(page, 'scheduled');
  await iniciarColeta(page);
}

test.describe('collectionExperience helper', () => {
  test('resolve query, storage e fallback com precedencia correta', async () => {
    const restore = installMemoryWindow({
      [COLLECTION_EXPERIENCE_STORAGE_KEY]: CURRENT_COLLECTION_EXPERIENCE,
    });

    try {
      expect(resolveCollectionExperience('?coleta=shell')).toBe(
        SHELL_COLLECTION_EXPERIENCE
      );
      expect(resolveCollectionExperience('?coleta=atual')).toBe(
        CURRENT_COLLECTION_EXPERIENCE
      );

      setStoredCollectionExperience(SHELL_COLLECTION_EXPERIENCE);
      expect(getStoredCollectionExperience()).toBe(SHELL_COLLECTION_EXPERIENCE);
      expect(resolveCollectionExperience()).toBe(SHELL_COLLECTION_EXPERIENCE);

      setStoredCollectionExperience(CURRENT_COLLECTION_EXPERIENCE);
      expect(getStoredCollectionExperience()).toBe(CURRENT_COLLECTION_EXPERIENCE);
      expect(resolveCollectionExperience()).toBe(CURRENT_COLLECTION_EXPERIENCE);

      (globalThis.window as MemoryWindow).localStorage.setItem(
        COLLECTION_EXPERIENCE_STORAGE_KEY,
        'invalid'
      );
      expect(resolveCollectionExperience()).toBe(CURRENT_COLLECTION_EXPERIENCE);

      clearStoredCollectionExperience();
      expect(getStoredCollectionExperience()).toBeNull();
      expect(resolveCollectionExperience()).toBe(CURRENT_COLLECTION_EXPERIENCE);

      expect(getExperienceActivationRequest('?experiencia=shell')).toBe(
        SHELL_COLLECTION_EXPERIENCE
      );
      expect(getExperienceActivationRequest('?experiencia=atual')).toBe(
        CURRENT_COLLECTION_EXPERIENCE
      );
      expect(getExperienceActivationRequest('?experiencia=qualquer')).toBeNull();
    } finally {
      restore();
    }
  });

  test('sem window ou storage retorna current com seguranca', async () => {
    const previousWindow = (globalThis as { window?: Window }).window;
    delete (globalThis as { window?: Window }).window;

    try {
      expect(getStoredCollectionExperience()).toBeNull();
      expect(resolveCollectionExperience()).toBe(CURRENT_COLLECTION_EXPERIENCE);
    } finally {
      if (previousWindow !== undefined) {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: previousWindow,
        });
      }
    }
  });
});

test.describe.serial('Acesso digno ao shell experimental', () => {
  test.beforeEach(async ({ page }) => {
    await normalizarPartidaQaEmTempoReal();
    await page.goto('/login');
    await page.evaluate((storageKey) => {
      window.localStorage.removeItem(storageKey);
    }, COLLECTION_EXPERIENCE_STORAGE_KEY);
  });

  test('sem preferencia definida o fluxo atual permanece padrao e o seletor mostra current', async ({
    page,
  }) => {
    await loginComoQa(page);
    await abrirConfiguracoes(page);

    await expect(page.getByTestId('collection-experience-current')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(page.getByTestId('collection-experience-shell')).toHaveAttribute(
      'aria-checked',
      'false'
    );

    await abrirColetaQaPelaNavegacaoNormal(page);
    await expect(page).toHaveURL(/\/scout-realtime(?:\?.*)?$/);
    expect(page.url()).not.toContain('coleta=');
    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();
  });

  test('selecionar shell nas configuracoes persiste a preferencia e abre a coleta normal no shell', async ({
    page,
  }) => {
    await loginComoQa(page);
    await abrirConfiguracoes(page);
    await selecionarExperiencia(page, 'shell');

    await expect(page.getByTestId('collection-experience-shell')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    await page.reload();
    await abrirConfiguracoes(page);
    await expect(page.getByTestId('collection-experience-shell')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    await abrirColetaQaPelaNavegacaoNormal(page);
    await expect(page).toHaveURL(/\/scout-realtime(?:\?.*)?$/);
    expect(page.url()).not.toContain('coleta=');
    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
    await expect(page.getByTestId('shell-badge')).toHaveText('Shell experimental');
  });

  test('query tecnica tem precedencia sobre storage e a URL de demonstracao ativa a preferencia sem abrir coleta', async ({
    page,
  }) => {
    await loginComoQa(page);
    await abrirConfiguracoes(page);
    await selecionarExperiencia(page, 'current');

    await page.goto('/dashboard?coleta=shell');
    await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
    await abrirColetaQaPelaNavegacaoNormal(page);
    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();

    await page.goto('/dashboard?coleta=atual');
    await expect(page.getByTestId('nav-dados-jogo')).toBeVisible();
    await abrirDadosDoJogo(page);
    await abrirPartidaQa(page, 'saved');
    await iniciarColeta(page);
    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();

    await page.goto('/dashboard?experiencia=shell');
    await expect(page).not.toHaveURL(/\/scout-realtime/);
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), COLLECTION_EXPERIENCE_STORAGE_KEY))
      .toBe(SHELL_COLLECTION_EXPERIENCE);
    await abrirConfiguracoes(page);
    await expect(page.getByTestId('collection-experience-shell')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  test('voltar para interface atual no shell so aplica na proxima coleta e nao apaga eventos', async ({
    page,
  }) => {
    await loginComoQa(page);
    await abrirConfiguracoes(page);
    await selecionarExperiencia(page, 'shell');
    await abrirColetaQaPelaNavegacaoNormal(page);

    await page.getByTestId('shell-clock-start').click();
    await expect(page.getByTestId('shell-clock-state')).toContainText('PRIMEIRO TEMPO');

    await abrirLogs(page);
    const initialLogCount = await contarEventosLog(page);
    await fecharLogs(page);

    await page.getByTestId('shell-finalization-start').click();
    await page.locator('[data-testid^="shell-player-"]').first().click();
    await page.getByTestId('shell-shot-result-outside').click();
    await page.getByTestId('shell-finalization-confirm').click();
    await expect(page.getByTestId('shell-success')).toBeVisible();

    await page.getByTestId('shell-return-current').click();
    await expect(page.getByTestId('collection-shell-experimental')).toBeVisible();
    await expect(page.getByTestId('shell-experience-notice')).toContainText(
      'A nova experiencia sera aplicada ao abrir a proxima coleta.'
    );

    await abrirLogs(page);
    expect(await contarEventosLog(page)).toBe(initialLogCount + 1);
    await fecharLogs(page);

    await salvarPartida(page);
    await abrirDadosDoJogo(page);
    await abrirPartidaQa(page, 'saved');
    await iniciarColeta(page);

    await expect(page.getByTestId('collection-shell-experimental')).toHaveCount(0);
    await expect(page.getByTestId('event-selector-shot')).toBeVisible();
  });

  test('rota direta sem partida continua apresentando erro seguro', async ({
    page,
  }) => {
    await page.goto('/scout-realtime');
    await expect(
      page.getByText(
        'Nenhum dado de partida encontrado. Por favor, selecione uma partida novamente.'
      )
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar' })).toBeVisible();
  });
});
