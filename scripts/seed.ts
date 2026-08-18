import "dotenv/config";
import { db } from "../lib/db";
import { quizzes, rounds, questions } from "../lib/db/schema";
import { v4 as uuid } from "uuid";

async function seed() {
  console.log("Cargando datos...");

  // Crear el quiz
  const quizId = uuid();
  await db.insert(quizzes).values({
    id: quizId,
    title: "La Luz y el Sol",
    description: "Quiz de Ciencias Naturales sobre la luz y el Sol.",
    slug: "luz-y-sol",
    icon: "\u2600\uFE0F",
    subject: "Ciencias Naturales",
    level: "Secundaria",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Ronda 1: La Luz
  const rondaLuzId = uuid();
  await db.insert(rounds).values({
    id: rondaLuzId,
    quizId: quizId,
    name: "La Luz",
    icon: "\uD83D\uDCA1",
    description: "Velocidad, onda y particula, reflexion y color.",
    order: 0,
  });

  const preguntasLuz = [
    { q: "\u00BFA qu\u00E9 velocidad viaja la luz, m\u00E1s o menos?", o: ["300 km por hora", "300.000 km por segundo", "300.000 km por hora", "3.000 km por segundo"], c: 1, e: "Casi 300.000 km/s: en un segundo dar\u00EDa 7 vueltas y media a la Tierra." },
    { q: "\u00BFQu\u00E9 necesita la luz para viajar por el espacio?", o: ["Aire", "Agua", "Nada: viaja por el vac\u00EDo", "Un cable"], c: 2, e: "El sonido necesita aire, pero la luz cruza el vac\u00EDo sin nada que la lleve." },
    { q: "La luz, \u00BFes onda o part\u00EDcula?", o: ["Solo onda", "Solo part\u00EDcula", "Las dos, seg\u00FAn c\u00F3mo la mires", "Ninguna de las dos"], c: 2, e: "Se comporta como onda o como part\u00EDcula. A las part\u00EDculas las llamamos fotones." },
    { q: "\u00BFPor qu\u00E9 en la oscuridad total no ves los objetos?", o: ["Porque desaparecen", "Porque no hay luz que rebote en ellos y llegue a tus ojos", "Porque tus ojos se apagan", "Porque se vuelven negros"], c: 1, e: "Ves las cosas por la luz que rebota en ellas. Sin luz que rebote, no hay imagen." },
    { q: "Una remera roja se ve roja porque...", o: ["Tiene color rojo adentro", "Absorbe el rojo", "Rebota el rojo y absorbe los dem\u00E1s colores", "Genera luz roja"], c: 2, e: "El color no est\u00E1 en las cosas: la remera rebota el rojo y absorbe el resto." },
    { q: "La Luna brilla de noche porque...", o: ["Produce su propia luz", "Refleja la luz del Sol", "Est\u00E1 muy caliente", "Tiene fuego adentro"], c: 1, e: "La Luna es una roca oscura: ves el Sol rebotando en ella." },
    { q: "Justo debajo del rojo, en el espectro, est\u00E1...", o: ["El ultravioleta", "El infrarrojo (calor)", "El sonido", "El vac\u00EDo"], c: 1, e: "El infrarrojo es el calorcito de una estufa; el ultravioleta est\u00E1 del lado del violeta." },
  ];

  let ordenLuz = 0;
  for (const p of preguntasLuz) {
    await db.insert(questions).values({
      id: uuid(),
      roundId: rondaLuzId,
      question: p.q,
      options: JSON.stringify(p.o),
      correctIndex: p.c,
      explanation: p.e,
      order: ordenLuz++,
    });
  }

  // Ronda 2: El Sol
  const rondaSolId = uuid();
  await db.insert(rounds).values({
    id: rondaSolId,
    quizId: quizId,
    name: "El Sol",
    icon: "\u2600\uFE0F",
    description: "Estrella, fusion, el viaje de la luz y otras estrellas.",
    order: 1,
  });

  const preguntasSol = [
    { q: "\u00BFCu\u00E1ntos a\u00F1os tiene el Sol, m\u00E1s o menos?", o: ["4.600 a\u00F1os", "4,6 millones de a\u00F1os", "4.600 millones de a\u00F1os", "46.000 millones de a\u00F1os"], c: 2, e: "Unos 4.600 millones de a\u00F1os: casi la edad de la Tierra, nacieron juntos." },
    { q: "\u00BFQu\u00E9 hace que el Sol brille?", o: ["Combusti\u00F3n, como una fogata", "Fusi\u00F3n nuclear: hidr\u00F3geno que forma helio", "Electricidad", "Lava"], c: 1, e: "No est\u00E1 prendido fuego: en su centro el hidr\u00F3geno se fusiona en helio y libera energ\u00EDa." },
    { q: "\u00BFCu\u00E1nto tarda la luz del Sol en llegar a la Tierra?", o: ["1 segundo", "8 minutos", "8 horas", "8 d\u00EDas"], c: 1, e: "Unos 8 minutos y 20 segundos para cruzar los 150 millones de km." },
    { q: "Cuando mir\u00E1s el Sol, en realidad ves...", o: ["El Sol de ahora mismo", "C\u00F3mo era hace 8 minutos", "El Sol de ma\u00F1ana", "Una imagen falsa"], c: 1, e: "La luz sali\u00F3 hace 8 minutos: est\u00E1s viendo el pasado." },
    { q: "El Sol es...", o: ["Un planeta", "Una estrella", "Una galaxia", "Una gran l\u00E1mpara"], c: 1, e: "Es una estrella, como las que ves de noche... solo que mucho m\u00E1s cerca." },
    { q: "Las estrellas que ves de noche son, en realidad...", o: ["Sat\u00E9lites", "Otros soles", "Reflejos del nuestro", "Planetas"], c: 1, e: "Cada estrellita es otro sol. Muchos, m\u00E1s grandes que el nuestro." },
    { q: "Si el Sol se apagara de golpe, \u00BFqu\u00E9 pasar\u00EDa?", o: ["Todo se oscurece al instante", "Lo ver\u00EDamos brillar unos 8 minutos m\u00E1s", "Nunca nos enterar\u00EDamos", "Explotar\u00EDa la Tierra"], c: 1, e: "Tardar\u00EDamos 8 minutos en 'enterarnos', porque esa luz ya ven\u00EDa en camino." },
  ];

  let ordenSol = 0;
  for (const p of preguntasSol) {
    await db.insert(questions).values({
      id: uuid(),
      roundId: rondaSolId,
      question: p.q,
      options: JSON.stringify(p.o),
      correctIndex: p.c,
      explanation: p.e,
      order: ordenSol++,
    });
  }

  console.log("Listo! Datos cargados con exito.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al cargar:", err);
    process.exit(1);
  });