// lib.dom ne déclare `BeforeUnloadEvent` qu'avec un constructeur sans argument : on part d'un
// `Event` réel annulable, complété du seul membre propre à `BeforeUnloadEvent`.
export function beforeUnloadEvent(): BeforeUnloadEvent {
  return Object.assign(new Event('beforeunload', { cancelable: true }), { returnValue: '' });
}
