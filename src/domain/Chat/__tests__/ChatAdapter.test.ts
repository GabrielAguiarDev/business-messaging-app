import {chatAdapter} from '../ChatAdapter';
import {ChatAPI, MessageAPI} from '../ChatTypes';

describe('chatAdapter', () => {
  it('toChat converte campos de atendimento', () => {
    const chatAPI: ChatAPI = {
      id: 'att-pedro',
      type: 'attendance',
      name: 'Pedro Antunes',
      initials: 'PA',
      avatar_color: '#e0864f',
      last_message: 'Oi',
      last_message_time: '09:05',
      unread_count: 1,
      is_muted: false,
      context: 'Yago · App do Hóspede',
      product: 'App do Hóspede',
      status: 'atendimento',
      assigned_to: 'Você',
    };

    const chat = chatAdapter.toChat(chatAPI);
    expect(chat.avatarColor).toBe('#e0864f');
    expect(chat.unreadCount).toBe(1);
    expect(chat.status).toBe('atendimento');
    expect(chat.assignedTo).toBe('Você');
  });

  it('toMessage monta author apenas quando nome e cor existem', () => {
    const withAuthor: MessageAPI = {
      id: '1',
      kind: 'text',
      text: 'Olá',
      is_mine: false,
      author_name: 'Fábio Lima',
      author_color: '#5b8def',
      time: '08:45',
    };
    const withoutAuthor: MessageAPI = {
      id: '2',
      kind: 'text',
      text: 'Oi',
      is_mine: true,
      time: '08:46',
      ticks: 'read',
    };

    expect(chatAdapter.toMessage(withAuthor).author).toEqual({
      name: 'Fábio Lima',
      color: '#5b8def',
    });
    expect(chatAdapter.toMessage(withoutAuthor).author).toBeUndefined();
    expect(chatAdapter.toMessage(withoutAuthor).ticks).toBe('read');
  });
});
