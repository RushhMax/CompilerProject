const fs = require('fs');

const FIN = -1; // Valor constante que indica el final de los tokens

let lexema = ''; // Variable para almacenar el lexema actual
let tok; // Variable para almacenar el token actual
let tokens = []; // Array para almacenar los tokens del texto
let currentTokenIndex = 0; // Índice actual en el array de tokens

module.exports = class SpanishDb {
    // Constructor de la clase
    constructor() {
        this.bd = null; // Base de datos que se cargará desde el archivo JSON
        this.ADJECTIVES = []; 
        this.ADVERBS =  [];
        this.PLACES = [];
        this.PEOPLE = [];
        this.PREPOSITIONS = [];
        this.PRONOUNS = []; // Array para almacenar artículos
        this.SUBJECTS = []; // Array para almacenar sujetos (sustantivos)
        this.VERBS = []; // Array para almacenar verbos
        this.loadBdFromFile(); // Carga la base de datos desde un archivo JSON
        this.addConjugatedVerbs(); // Agrega las formas conjugadas de los verbos
        console.log('SPANISHDB DONE');
    }

    // Carga la base de datos desde un archivo JSON
    loadBdFromFile() {
        // Lee el archivo JSON y convierte su contenido a una cadena
        let str = fs.readFileSync('./diccionario/spanish.json').toString();

        // Parsea la cadena JSON a un objeto JavaScript
        let struct = JSON.parse(str);

        // Valida que el JSON se haya parseado correctamente
        if (struct && str) {
            this.ADJECTIVES = Object.keys(struct.adjetivos || []);
            this.ADVERBS = Object.keys(struct.adverbios || []);
            this.PLACES = Object.keys(struct.lugares || []);
            this.PEOPLE = Object.keys(struct.personas || []);
            this.PREPOSITIONS = Object.keys(struct.preposiciones || []);
            this.PRONOUNS = Object.keys(struct.pronombres || []);
            this.SUBJECTS = Object.keys(struct.sustantivos || []);
            this.VERBS = Object.keys(struct.verbos || []);
        } else {
            // Imprime un mensaje de error si el JSON no se parseó correctamente
            console.log("Error: JSON de idioma mal armado.");
        }
    }

    // Agrega formas conjugadas de los verbos a la lista de verbos
    addConjugatedVerbs() {
        const conjugated = []; // Array para almacenar las formas conjugadas

        if (Array.isArray(this.VERBS)) {
            this.VERBS.forEach((verb) => {
                const forms = this.conjugateVerb(verb); // Conjuga el verbo
                if (forms) {
                    conjugated.push(...forms); // Agrega las formas conjugadas al array
                }
            });

            // Añade las formas conjugadas a la lista original de verbos
            this.VERBS = this.VERBS.concat(conjugated);
        } else {
            console.error('VERBS is not an array'); // Imprime un mensaje de error si VERBS no es un array
        }
    }

    // Conjuga un verbo en sus formas regulares
    conjugateVerb(verb){
        const endings = {
            'AR': ['O', 'AS', 'A', 'AMOS', 'ÁIS', 'AN'],
            'ER': ['O', 'ES', 'E', 'EMOS', 'ÉIS', 'EN'],
            'IR': ['O', 'ES', 'E', 'IMOS', 'ÍS', 'EN']
        };

        let stem, verbType, pronoun;

        // Determina el tipo de verbo (-ar, -er, -ir) y conjuga el verbo
        if (verb.endsWith('ARSE')) {
            stem = verb.slice(0, -4); // Elimina 'arse' para obtener la raíz
            pronoun = "ME ";
            verbType = 'AR';
        } else if (verb.endsWith('ERSE')) {
            stem = verb.slice(0, -4); // Elimina 'erse' para obtener la raíz
            pronoun = "ME ";
            verbType = 'ER';
        } else if (verb.endsWith('irse')) {
            stem = verb.slice(0, -4); // Elimina 'irse' para obtener la raíz
            pronoun = "ME ";
            verbType = 'IR';
        } else {
            if (verb.endsWith('AR')) {
                stem = verb.slice(0, -2); // Elimina 'ar' para obtener la raíz
                verbType = 'AR';
                pronoun = "";
            } else if (verb.endsWith('ER')) {
                stem = verb.slice(0, -2); // Elimina 'er' para obtener la raíz
                verbType = 'ER';
                pronoun = "";
            } else if (verb.endsWith('IR')) {
                stem = verb.slice(0, -2); // Elimina 'ir' para obtener la raíz
                verbType = 'IR';
                pronoun = "";
            } else {
                return null; // Tipo de verbo desconocido
            }
        }

        // Conjuga el verbo y devuelve las formas conjugadas
        const conjugatedForms = endings[verbType].map(ending => `${pronoun}${stem}${ending}`);
        return conjugatedForms;
    }

    // Encuentra el tipo de token para una palabra dada
    findWordToken(word) {
        let resu = []; // Array para almacenar los tipos de tokens encontrados

        // Lista de listas y funciones para verificar los tipos de palabras
        let listFn = [
            { list: this.ADJECTIVES, val: 'adjetivo', fn: this.findElemNomb },
            { list: this.ADVERBS, val: 'adverbio', fn: this.findElemNomb },
            { list: this.PREPOSITIONS, val: 'preposicion', fn: this.findElemNomb },
            { list: this.SUBJECTS, val: 'sustantivo', fn: this.findElemNomb },
            { list: this.VERBS, val: 'verbo', fn: this.findElemNomb },
            { list: this.PRONOUNS, val: 'pronombre', fn: this.findElemNomb },
            { list: this.PEOPLE, val: 'persona', fn: this.findElemNomb },
            { list: this.PLACES, val: 'lugar', fn: this.findElemNomb }
        ];

        // Verifica cada palabra contra las categorías definidas
        listFn.forEach((item) => {
            if (item.fn(item.list, word))
                resu.push(item.val); // Agrega el tipo de token al resultado si se encuentra en la lista
        });

        if (!isNaN(word)) resu.push('numero'); // Agrega 'numero' si la palabra es un número

        return resu; // Devuelve los tipos de tokens encontrados
    }

    // Función auxiliar para verificar si una palabra está en una lista de elementos
    findElemNomb(items, word) {
        if (!Array.isArray(items)) {
            console.error('Items is not an array:', items);
            return false;
        }

        const cleanStr = (cadena) => {
            // Normaliza la cadena para eliminar acentos y caracteres especiales
            cadena = cadena.replace(/á/gi, "a");
            cadena = cadena.replace(/é/gi, "e");
            cadena = cadena.replace(/í/gi, "i");
            cadena = cadena.replace(/ó/gi, "o");
            cadena = cadena.replace(/ú/gi, "u");
            cadena = cadena.replace(/ñ/gi, "n");
            cadena = cadena.replace(/Á/gi, "A");
            cadena = cadena.replace(/É/gi, "E");
            cadena = cadena.replace(/Í/gi, "I");
            cadena = cadena.replace(/Ó/gi, "O");
            cadena = cadena.replace(/Ú/gi, "U");
            cadena = cadena.replace(/Ñ/gi, "N");

            return cadena.toUpperCase(); // Convierte la cadena a mayúsculas
        };

        return (items[cleanStr(word)] != null);
    }

    // Analiza un texto y determina el tipo de cada palabra
    analyseText(texto) {
        console.log('Analizando ',texto);

        let final = []; // Array para almacenar los resultados del análisis

        let bloques = texto.split(" "); // Divide el texto en palabras por espacios

        // Itera sobre cada palabra y encuentra su tipo de token
        bloques.forEach((elem) => {
            console.log(elem);
            let token = this.findWordToken(elem);
            final.push({"word": elem, "token": token}); // Almacena el resultado en el array final
        });
        return final; // Devuelve el array con los resultados
    }

    // Analiza un texto y devuelve el resultado en forma de array
    analyseTextArray(texto) {
        let resu = this.analyseText(texto); // Obtiene los resultados del análisis
        let salida = []; // Array para almacenar el resultado final

        resu.forEach((item) => {
            salida[item.word] = item.token; // Asigna el tipo de token a cada palabra en el array
        });

        return salida; // Devuelve el array con los resultados
    }

    analyseTextFile(file) {
        const input = fs.readFileSync(file, 'utf-8');
        const lines = input.split('.');
    
        for (const line of lines) {
            if (line.trim() === '') continue;
    
            const cleanLine = line.replace(/[\r\n]+/g, '');
            // IMPRIME LA LINEA LIMPIA
            console.log(cleanLine);
    
            tokens = line.trim().split(/\s+/);
            currentTokenIndex = 0;
            tok = this.scanner();
    
            this.Oracion();
    
            if (tok !== FIN) this.error();
    
            console.log('La oración es válida.');
        }
    }

    // Verifica si el token actual es el esperado y avanza al siguiente token
    parea(expectedToken) {
        if (tok === expectedToken) {
            tok = this.scanner(); // Obtiene el siguiente token
        } else {
            this.error(); // Muestra un error si el token no es el esperado
        }
    }

    // Muestra un mensaje de error y termina el proceso
    error() {
        console.error('Syntax error');
        process.exit(1);
    }

    // 
    scanner() {
        if (currentTokenIndex >= tokens.length) return FIN; // Retorna FIN si se ha llegado al final de los tokens

        const token = tokens[currentTokenIndex++]; // Obtiene el token actual
        lexema = token; // Almacena el token como lexema
        return token;
    }

    // Análisis de una oración 
    Oracion() {
        if (this.findElemNomb(this.ARTICLES, tok) || this.findElemNomb(this.SUBJECTS, tok)) {
            this.Sujeto();
            this.Predicado();
        } else if (this.findElemNomb(this.VERBS, tok)) {
            this.Predicado();
        } else {
            console.log('Falló en Oracion');
            this.error();
        }
    }

    // Análisis del sujeto en la oración
    Sujeto() {
        if (this.findElemNomb(this.ARTICLES, tok)) {
            this.Articulo(tok);
            this.Sustantivo(tok);
        } else if (this.findElemNomb(this.SUBJECTS, tok) || this.findElemNomb(this.PRONOUNS, tok)) {
            this.Sustantivo(tok);
        } else {
            console.log('Falló en Sujeto');
            this.error();
        }
    }

    // Análisis del predicado
    Predicado(tok) {
        if (this.findElemNomb(this.VERBS, tok)) {
            this.Verbo(tok);
            // Further analysis can be done for direct objects, complements, etc.
        } else {
            console.log('Falló en Predicado');
            this.error();
        }
    }

    // Analyze the noun
    Sustantivo(tok) {
        if (this.findElemNomb(this.SUBJECTS, tok) || this.findElemNomb(this.PRONOUNS, tok)) {
            console.log('Sustantivo encontrado:', tok);
        } else {
            console.log('Falló en Sustantivo');
            this.error();
        }
    }

    // Analyze the article
    Articulo(tok) {
        if (this.findElemNomb(this.ARTICLES, tok)) {
            console.log('Artículo encontrado:', tok);
        } else {
            console.log('Falló en Articulo');
            this.error();
        }
    }

    // Analyze the verb
    Verbo(tok) {
        if (this.findElemNomb(this.VERBS, tok)) {
            console.log('Verbo encontrado:', tok);
        } else {
            console.log('Falló en Verbo');
            this.error();
        }
    }
}