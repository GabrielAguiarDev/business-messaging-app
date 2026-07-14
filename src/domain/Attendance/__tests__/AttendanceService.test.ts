import {mockDb as chatMockDb} from '../../Chat/ChatApiMockDb';
import {attendanceService} from '../AttendanceService';

describe('attendanceService (fluxo sobre o mock)', () => {
  it('assume move da fila aguardando e cria chat de atendimento FORA da lista de Chats', async () => {
    const before = await attendanceService.getQueues('c1');
    const item = before.aguardando[0];

    const chatId = await attendanceService.assume({
      channelId: 'c1',
      itemId: item.id,
    });

    expect(chatId).toBe(`att-${item.id}`);

    const after = await attendanceService.getQueues('c1');
    expect(after.aguardando).toHaveLength(before.aguardando.length - 1);
    expect(after.atendimento[0].id).toBe(chatId);
    expect(after.atendimento[0].assignedTo).toBe('Você');

    // regra: atendimento não aparece na lista de Chats
    expect(chatMockDb.chats.find(c => c.id === chatId)).toBeUndefined();
    const chat = chatMockDb.hiddenChats.find(c => c.id === chatId);
    expect(chat?.type).toBe('attendance');
    expect(chat?.status).toBe('atendimento');
    expect(chatMockDb.threads[chatId][0].kind).toBe('system');
  });

  it('resolve move para resolvidas e adiciona mensagem de sistema', async () => {
    const queues = await attendanceService.getQueues('c1');
    const chatId = queues.atendimento[0].id;
    const threadLength = chatMockDb.threads[chatId]?.length ?? 0;

    await attendanceService.resolve(chatId);

    const after = await attendanceService.getQueues('c1');
    expect(after.atendimento.find(i => i.id === chatId)).toBeUndefined();
    expect(after.resolvidas[0].id).toBe(chatId);

    const chat =
      chatMockDb.chats.find(c => c.id === chatId) ??
      chatMockDb.hiddenChats.find(c => c.id === chatId);
    expect(chat?.status).toBe('resolvida');
    expect(chatMockDb.threads[chatId]).toHaveLength(threadLength + 1);
    expect(chatMockDb.threads[chatId].at(-1)?.text).toBe(
      'Conversa marcada como resolvida por Você',
    );
  });

  it('openQueueItem registra chat oculto para conversas de terceiros', async () => {
    const chatId = await attendanceService.openQueueItem({
      channelId: 'c1',
      itemId: 'att-joao',
    });

    expect(chatId).toBe('att-joao');
    const hidden = chatMockDb.hiddenChats.find(c => c.id === 'att-joao');
    expect(hidden?.assigned_to).toBe('Carla Nunes');
    expect(chatMockDb.threads['att-joao'][0].text).toBe(
      'Conversa assumida por Carla Nunes',
    );
  });
});
