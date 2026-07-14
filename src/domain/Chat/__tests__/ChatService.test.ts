import {mockDb} from '../ChatApiMockDb';
import {chatService} from '../ChatService';

describe('chatService.deleteChat', () => {
  it('remove a conversa da lista e apaga a thread', async () => {
    const chat = await chatService.startDm({
      id: 'u-teste',
      name: 'Teste da Silva',
      role: 'QA',
      department: 'TI',
      email: 'teste@yago.com',
      initials: 'TS',
      avatarColor: '#3f9d8f',
      isAdmin: false,
      online: false,
    });
    expect(mockDb.chats.some(c => c.id === chat.id)).toBe(true);

    await chatService.deleteChat(chat.id);

    expect(mockDb.chats.some(c => c.id === chat.id)).toBe(false);
    expect(mockDb.hiddenChats.some(c => c.id === chat.id)).toBe(false);
    expect(mockDb.threads[chat.id]).toBeUndefined();
  });

  it('falha para conversa inexistente', async () => {
    await expect(chatService.deleteChat('nao-existe')).rejects.toThrow(
      'Conversa não encontrada',
    );
  });
});
