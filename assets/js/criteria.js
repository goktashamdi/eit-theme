/**
 * Edop E-Takip Criteria Module v1.0
 * E-\u0130\u00e7erik \u0130nceleme Kriterleri - Kategorize, Aranabilir, \u00d6zel Kriter Eklenebilir
 */
(function () {
    'use strict';

    var $view, $btn;
    var activeCategory = '1';
    var searchQuery = '';
    var customCriteria = [];

    /* ========================================================================
       CRITERIA DATA - 8 Ana Kategori
       ======================================================================== */
    var categories = [
        {
            id: '1',
            title: 'Anayasa ve Di\u011fer Mevzuata Uygunlu\u011fu',
            shortTitle: 'Anayasa',
            color: '#ef4444',
            subs: [
                {
                    id: '1.1',
                    title: 'Genel',
                    items: [
                        { id: '1.1.1', text: 'Anayasa, taraf oldu\u011fumuz uluslararas\u0131 s\u00f6zle\u015fmeler, kanunlar ve di\u011fer mevzuata ayk\u0131r\u0131 bir husus bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.2', text: '\u0130\u00e7erikte ter\u00f6r \u00f6rg\u00fctleri ile irtibatl\u0131 veya iltisakl\u0131 herhangi bir g\u00f6rsel veya yaz\u0131l\u0131 \u00f6ge, ifade yahut ima bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.3', text: 'T\u00fcrkiye Cumhuriyeti\u2019ni uluslararas\u0131 alanlarda zor duruma d\u00fc\u015f\u00fcrecek veya mill\u00ee menfaatlere zarar verecek i\u00e7erik bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.4', text: '\u0130\u00e7erikte Ki\u015fisel Verilerin Korunmas\u0131 Kanunu\u2019na ayk\u0131r\u0131l\u0131k te\u015fkil edecek herhangi bir unsur yer almamal\u0131d\u0131r.' },
                        { id: '1.1.5', text: '\u0130\u00e7erikte ba\u011f\u0131ml\u0131l\u0131k yap\u0131c\u0131, m\u00fcstehcen, \u00f6\u011frencilerin maneviyat\u0131na ve ki\u015filik geli\u015fimlerine olumsuz etki edebilecek herhangi bir unsur a\u00e7\u0131k veya \u00f6rt\u00fck bir bi\u00e7imde bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.6', text: '\u0130\u00e7eriklerde \u00f6\u011fretim program\u0131na uygun olarak ilgili \u00fcnite/tema/\u00f6\u011frenme alanlar\u0131n\u0131n ba\u011flam\u0131 g\u00f6z \u00f6n\u00fcnde bulundurularak psikolojik, fiziksel, s\u00f6zl\u00fc ve siber zorbal\u0131kla m\u00fccadele durumlar\u0131na y\u00f6nelik yaz\u0131l\u0131 veya g\u00f6rsel unsurlara yer verilmelidir.' },
                        { id: '1.1.7', text: '\u0130\u00e7erik genelinde engellilik konusunda fark\u0131ndal\u0131k olu\u015fturacak pozitif bir temsil sa\u011flanmal\u0131d\u0131r.' },
                        { id: '1.1.8', text: '\u0130\u00e7erikte engelli bireyler hakk\u0131nda genellemeler yap\u0131larak bu bireyleri belirli k\u0131s\u0131tlamalarla tan\u0131mlayan ifade ve g\u00f6rseller yer almamal\u0131d\u0131r.' },
                        { id: '1.1.9', text: '\u0130\u00e7erikte hayvan haklar\u0131na ayk\u0131r\u0131l\u0131k te\u015fkil edecek yaz\u0131l\u0131/g\u00f6rsel herhangi bir unsur bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.10', text: 'Kurulum gerektiren e-i\u00e7eriklerde kullan\u0131c\u0131dan gerekli izinler al\u0131nmal\u0131, hangi iznin neden istendi\u011fi ve ne t\u00fcr bilgiler toplanaca\u011f\u0131 kullan\u0131c\u0131lara a\u00e7\u0131k ve net bir \u015fekilde belirtilmelidir.' },
                        { id: '1.1.11', text: '\u0130\u00e7erik herhangi bir reklam unsuru i\u00e7ermemelidir.' },
                        { id: '1.1.12', text: '\u0130\u00e7erikte farkl\u0131 gelir seviyelerinden ve sosyal konumlardan gelen bireyleri k\u00fc\u00e7\u00fclten ya da a\u015f\u0131r\u0131 y\u00fccelten herhangi bir ifade veya ima yer almamal\u0131d\u0131r.' },
                        { id: '1.1.13', text: '\u0130\u00e7erikte \u00f6\u011fretim program\u0131 ile uyumlu olacak \u015fekilde \u00e7evre ve s\u00fcrd\u00fcr\u00fclebilirlik konular\u0131na yer verilmelidir.' },
                        { id: '1.1.14', text: '\u0130\u00e7erikte \u00e7evre bilincine ayk\u0131r\u0131 mesajlar i\u00e7eren yaz\u0131l\u0131/g\u00f6rsel herhangi bir unsur bulunmamal\u0131d\u0131r.' },
                        { id: '1.1.15', text: '\u0130\u00e7erik \u00f6\u011frencilerin adalet duygusunu geli\u015ftirecek, etik de\u011ferleri benimsemelerini, mill\u00ee birlik ve beraberli\u011fe katk\u0131da bulunmalar\u0131n\u0131 sa\u011flayacak bir yap\u0131da olmal\u0131d\u0131r.' },
                        { id: '1.1.16', text: 'E\u011fitim arac\u0131nda Atat\u00fcrk Portresi, \u0130stikl\u00e2l Mar\u015f\u0131, Gen\u00e7li\u011fe Hitabe, And\u0131m\u0131z, T\u00fcrkiye Haritas\u0131 ve T\u00fcrk D\u00fcnyas\u0131 Haritas\u0131 ile arka kapak tasar\u0131m\u0131 Kurulun uygun g\u00f6rd\u00fc\u011f\u00fc ve Y\u00f6netmelik\u2019te belirtilen \u015fekilde kullan\u0131lmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '1.2',
                    title: 'Telif ve \u0130ntihal',
                    items: [
                        { id: '1.2.1', text: 'Yaz\u0131l\u0131 ve g\u00f6rsel t\u00fcm i\u00e7erikte al\u0131nt\u0131 ve at\u0131flar telif haklar\u0131 mevzuat\u0131na uygun olarak yap\u0131lmal\u0131d\u0131r.' },
                        { id: '1.2.2', text: '\u0130\u00e7erikte herhangi bir ders kitab\u0131 kaynak olarak g\u00f6sterilmemeli, bu kitaplardan al\u0131nt\u0131 yap\u0131lmamal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '2',
            title: '\u0130\u00e7eri\u011fin Bilimsel Olarak Yeterli\u011fi',
            shortTitle: 'Bilimsel',
            color: '#3b82f6',
            subs: [
                {
                    id: '2.1',
                    title: '\u0130\u00e7erik',
                    items: [
                        { id: '2.1.1', text: '\u0130\u00e7erik bilimsellik ilkesi g\u00f6zetilerek olu\u015fturulmal\u0131d\u0131r.' },
                        { id: '2.1.2', text: '\u0130\u00e7erikte bilgi hatas\u0131 bulunmamal\u0131d\u0131r.' },
                        { id: '2.1.3', text: '\u0130\u00e7erikte bilgi eksikli\u011fi bulunmamal\u0131d\u0131r.' },
                        { id: '2.1.4', text: 'Metin ile g\u00f6rsel uyumlu olmal\u0131d\u0131r.' },
                        { id: '2.1.5', text: 'G\u00f6rsel ile ilgili a\u00e7\u0131klamaya ihtiya\u00e7 duyulmas\u0131 durumunda eklenen alt yaz\u0131 ile g\u00f6rsel uyumlu olmal\u0131d\u0131r.' },
                        { id: '2.1.6', text: 'Alana ve konunun \u00f6zelli\u011fine uygun kavram ve terimler kullan\u0131lmal\u0131d\u0131r.' },
                        { id: '2.1.7', text: '\u0130\u00e7erikte kullan\u0131lan al\u0131nt\u0131, eserin orijinaline uygun olarak verilmelidir.' },
                        { id: '2.1.8', text: 'Yabanc\u0131 diller, ya\u015fayan diller ve leh\u00e7eler i\u00e7in haz\u0131rlanan e\u011fitim ara\u00e7lar\u0131 o dilin yaz\u0131m, noktalama ve dil bilgisi kurallar\u0131na uygun olmal\u0131d\u0131r.' },
                        { id: '2.1.9', text: 'Metinleri kullan\u0131lan yazar ve \u015fairlerin biyografilerinin verili\u015finde s\u0131n\u0131f seviyesi g\u00f6z \u00f6n\u00fcnde bulundurulmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '2.2',
                    title: 'Standart B\u00f6l\u00fcmler',
                    items: [
                        { id: '2.2.1', text: 'E\u011fitim arac\u0131nda t\u00fcm sayfalar, e\u011fitim arac\u0131na ait ekler ve standart b\u00f6l\u00fcmler eksiksiz ve s\u0131ral\u0131 bir bi\u00e7imde yer almal\u0131d\u0131r.' },
                        { id: '2.2.2', text: '\u0130\u00e7erik g\u00fcvenlik bak\u0131m\u0131ndan gerekli uyar\u0131 ve tedbirlere uygun \u015fekilde d\u00fczenlenmelidir.' },
                        { id: '2.2.3', text: 'S\u00f6zl\u00fck belirli ilkeler do\u011frultusunda, standarda ba\u011fl\u0131 kal\u0131narak olu\u015fturulmal\u0131d\u0131r.' },
                        { id: '2.2.4', text: 'Kaynak\u00e7a belirli ilkeler do\u011frultusunda, belli bir standarda ba\u011fl\u0131 kal\u0131narak olu\u015fturulmal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '3',
            title: '\u0130\u00e7eri\u011fin E\u011fitim ve \u00d6\u011fretim Program\u0131n\u0131n Ama\u00e7 ve Kapsam\u0131na Uygunlu\u011fu',
            shortTitle: 'E\u011fitim-\u00d6\u011fretim',
            color: '#22c55e',
            subs: [
                {
                    id: '3.1',
                    title: '\u00d6\u011frenme \u00c7\u0131kt\u0131lar\u0131na Uygunluk',
                    items: [
                        { id: '3.1.1', text: '\u0130\u00e7erik, t\u00fcm \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131 ile \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131n\u0131n s\u00fcrec bile\u015fenlerini ilgili \u00f6\u011fretim program\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u00f6ng\u00f6r\u00fcld\u00fc\u011f\u00fc bi\u00e7imde kar\u015f\u0131lamal\u0131d\u0131r.' },
                        { id: '3.1.2', text: '\u00d6\u011frenme \u00e7\u0131kt\u0131lar\u0131, \u00f6\u011frencilerin b\u00fct\u00fcnc\u00fcl geli\u015fimini ve ilerlemesini \u00f6l\u00e7\u00fclebilir bi\u00e7imde s\u00fcrec temelli bir yap\u0131da vermelidir.' }
                    ]
                },
                {
                    id: '3.2',
                    title: '\u0130\u00e7eri\u011fin Kapsam\u0131',
                    items: [
                        { id: '3.2.1', text: 'E\u011fitim arac\u0131 ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n i\u00e7erik \u00e7er\u00e7evesini kar\u015f\u0131lamal\u0131d\u0131r.' },
                        { id: '3.2.2', text: '\u0130\u00e7erik, \u00f6\u011fretim programlar\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme ya\u015fant\u0131lar\u0131 b\u00f6l\u00fcmlerinde yer alan \u00f6n de\u011ferlendirme s\u00fcreci ile k\u00f6pr\u00fc kurma bile\u015fenlerini kar\u015f\u0131lamal\u0131d\u0131r.' },
                        { id: '3.2.3', text: '\u00d6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u201cistenebilir, verilebilir, vb.\u201d \u015feklinde biten, \u00f6\u011frenme \u00e7\u0131kt\u0131s\u0131na ili\u015fkin konunun ve s\u0131n\u0131f\u0131n \u015fartlar\u0131 g\u00f6z \u00f6n\u00fcnde bulundurularak yaz\u0131lm\u0131\u015f \u00f6rnek \u00f6\u011fretim y\u00f6ntemlerine i\u00e7erikte yer verilebilir.' },
                        { id: '3.2.4', text: '\u0130\u00e7erik anla\u015f\u0131l\u0131r olmal\u0131d\u0131r.' },
                        { id: '3.2.5', text: '\u0130\u00e7erik, konu alan\u0131n\u0131n \u00f6zelli\u011fine uygun olarak b\u00fct\u00fcnsel bir yap\u0131da verilmelidir.' },
                        { id: '3.2.6', text: '\u0130\u00e7erik ilgili ya\u015f ve s\u0131n\u0131f seviyesine uygun olmal\u0131d\u0131r.' },
                        { id: '3.2.7', text: '\u0130\u00e7eri\u011fin da\u011f\u0131l\u0131m\u0131 \u00fcnite/tema/\u00f6\u011frenme alan\u0131 ve hedeflenen s\u00fcre baz\u0131nda dengeli olmal\u0131d\u0131r.' },
                        { id: '3.2.8', text: '\u0130\u00e7erik, ilgili \u00f6\u011fretim program\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 kapsam\u0131ndaki e\u011fitim ve \u00f6\u011fretim ilkeleri dikkate al\u0131narak olu\u015fturulmal\u0131d\u0131r.' },
                        { id: '3.2.9', text: '\u0130\u00e7erik \u00f6\u011frencilerin farkl\u0131 \u00f6\u011frenme stratejileri ve stillerini kullanmas\u0131na imk\u00e2n tan\u0131mal\u0131d\u0131r.' },
                        { id: '3.2.10', text: 'Strateji, y\u00f6ntem veya teknik se\u00e7imi dersin niteli\u011fine ve \u00f6\u011fretim program\u0131na uygun olmal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '4',
            title: '\u0130\u00e7eri\u011fin E\u011fitim ve \u00d6\u011fretim Program\u0131n\u0131n B\u00fct\u00fcnle\u015fik Yap\u0131s\u0131na Uygunlu\u011fu',
            shortTitle: 'B\u00fct\u00fcnle\u015fik Yap\u0131',
            color: '#f59e0b',
            subs: [
                {
                    id: '4.1',
                    title: 'Programlar Aras\u0131 Bile\u015fenlere Uygunluk',
                    items: [
                        { id: '4.1.1', text: '\u0130\u00e7erik, ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u00f6ng\u00f6r\u00fclen sosyal-duygusal \u00f6\u011frenme becerilerini destekleyecek \u015fekilde haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '4.1.2', text: '\u0130\u00e7erik, ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u00f6ng\u00f6r\u00fclen de\u011ferleri \u201cErdem-De\u011fer-Eylem \u00c7er\u00e7evesi\u201dne uygun ve destekleyecek \u015fekilde haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '4.1.3', text: '\u0130\u00e7erik, ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u00f6ng\u00f6r\u00fclen sistem okuryazarl\u0131\u011f\u0131n\u0131 destekleyecek \u015fekilde haz\u0131rlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '4.2',
                    title: 'B\u00fct\u00fcnc\u00fcl E\u011fitim Yakla\u015f\u0131m\u0131',
                    items: [
                        { id: '4.2.1', text: '\u0130\u00e7erik, ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmlerinde \u00f6ng\u00f6r\u00fclen e\u011filimleri destekleyecek \u015fekilde haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '4.2.2', text: '\u0130lgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n beceriler aras\u0131 ili\u015fkiler b\u00f6l\u00fcm\u00fcnde g\u00f6sterilen beceriler, \u00f6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcm\u00fcnde \u00f6ng\u00f6r\u00fcld\u00fc\u011f\u00fc bi\u00e7imde \u00f6\u011frenme \u00e7\u0131kt\u0131s\u0131yla ili\u015fkilendirilerek verilmelidir.' },
                        { id: '4.2.3', text: '\u0130\u00e7erikte \u00f6\u011fretim program\u0131nda yer verilen disiplinler aras\u0131 ili\u015fkiler ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131 ile anlaml\u0131 bir b\u00fct\u00fcnl\u00fck olu\u015fturacak bi\u00e7imde ili\u015fkilendirilerek verilmelidir.' },
                        { id: '4.2.4', text: '\u0130lgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n farkl\u0131la\u015ft\u0131rma b\u00f6l\u00fcmlerine kitaplar\u0131n bas\u0131l\u0131 n\u00fcshas\u0131nda yer verilmez. Ancak bu b\u00f6l\u00fcmlerde \u00f6ng\u00f6r\u00fclen i\u00e7eriklerin tamam\u0131 k\u0131lavuzda yer alan kriterlere uygun olmal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '5',
            title: 'Dil ve Anlat\u0131m Y\u00f6n\u00fcnden Yeterli\u011fi',
            shortTitle: 'Dil ve Anlat\u0131m',
            color: '#8b5cf6',
            subs: [
                {
                    id: '5.1',
                    title: 'Dil ve \u00dcslup',
                    items: [
                        { id: '5.1.1', text: '\u0130\u00e7erik T\u00fcrk\u00e7enin do\u011fru ve \u00f6zenli kullan\u0131m\u0131n\u0131; dilin anlat\u0131m zenginli\u011fini, g\u00fcc\u00fcn\u00fc ve anlam inceliklerini yans\u0131t\u0131r nitelikte olmal\u0131d\u0131r.' },
                        { id: '5.1.2', text: '\u00d6\u011frencilerin s\u0131n\u0131f seviyelerine uygun ve s\u00f6z varl\u0131klar\u0131n\u0131 zenginle\u015ftirmeye y\u00f6nelik bir dil kullan\u0131lmal\u0131d\u0131r.' },
                        { id: '5.1.3', text: '\u00d6zel ad, yabanc\u0131 s\u00f6zc\u00fck ve s\u00f6zc\u00fck gruplar\u0131n\u0131n okunu\u015fu ile k\u0131saltmalar\u0131n a\u00e7\u0131l\u0131m\u0131 i\u00e7indekiler b\u00f6l\u00fcm\u00fc, \u00fcnite/tema/\u00f6\u011frenme alan\u0131 kapaklar\u0131 ve ba\u015fl\u0131klar haricinde ilk ge\u00e7ti\u011fi yerde verilmelidir.' }
                    ]
                },
                {
                    id: '5.2',
                    title: 'Yaz\u0131 Dili Standartlar\u0131na Uygunluk',
                    items: [
                        { id: '5.2.1', text: '\u0130\u00e7erikte anlamsal veya yap\u0131sal anlat\u0131m bozuklu\u011fu bulunmamal\u0131d\u0131r.' },
                        { id: '5.2.2', text: '\u0130\u00e7erikte yaz\u0131m yanl\u0131\u015f\u0131 bulunmamal\u0131d\u0131r.' },
                        { id: '5.2.3', text: '\u0130\u00e7erikte noktalama eksikli\u011fi, yanl\u0131\u015fl\u0131\u011f\u0131 veya gereksiz noktalama i\u015fareti kullan\u0131m\u0131 olmamal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '5.3',
                    title: 'Anlam ve Anlat\u0131m',
                    items: [
                        { id: '5.3.1', text: 'Anlat\u0131m ilkelerine (ak\u0131c\u0131l\u0131k, yal\u0131nl\u0131k, a\u00e7\u0131kl\u0131k, duruluk vb.) uygun bir dil kullan\u0131lmal\u0131d\u0131r.' },
                        { id: '5.3.2', text: 'Metin i\u00e7erisinde kullan\u0131lan s\u00f6zc\u00fck ve s\u00f6zc\u00fck gruplar\u0131, ba\u011flama uygun bi\u00e7imde verilmelidir.' },
                        { id: '5.3.3', text: 'Metni olu\u015fturan birimler (c\u00fcmle, paragraf vb.) aras\u0131nda anlam ve anlat\u0131m b\u00fct\u00fcnl\u00fc\u011f\u00fc sa\u011flanmal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '6',
            title: 'G\u00f6rsel Tasar\u0131m\u0131n ve \u0130\u00e7erik Tasar\u0131m\u0131n\u0131n Uygunlu\u011fu',
            shortTitle: 'G\u00f6rsel Tasar\u0131m',
            color: '#ec4899',
            subs: [
                {
                    id: '6.1',
                    title: 'Genel Tasar\u0131m',
                    items: [
                        { id: '6.1.1', text: 'Kapak tasar\u0131m\u0131 genel tasar\u0131m ilkelerine, Y\u00f6netmelik\u2019te belirlenmi\u015f ilkelere ve \u201cDers Kitab\u0131 Kapa\u011f\u0131 Tasar\u0131m \u00c7er\u00e7evesi\u201dne uygun olmal\u0131d\u0131r.' },
                        { id: '6.1.2', text: '\u0130\u00e7indekiler listesi sistematik ve i\u015flevsel olmal\u0131d\u0131r.' },
                        { id: '6.1.3', text: 'Tasar\u0131mda kullan\u0131lan \u00f6geler sistematik bir b\u00fct\u00fcnl\u00fc\u011fe sahip olmal\u0131d\u0131r.' },
                        { id: '6.1.4', text: 'Sayfa tasar\u0131m\u0131 genel tasar\u0131m ilkelerine uygun olmal\u0131d\u0131r.' },
                        { id: '6.1.5', text: 'Sayfalar ve g\u00f6rseller estetik olarak tasarlanmal\u0131d\u0131r.' },
                        { id: '6.1.6', text: '\u0130\u00e7erik \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131 ve s\u00fcrec bile\u015fenlerinin ger\u00e7ekle\u015fmesini ve \u00f6\u011frenmeyi destekleyecek, anlamay\u0131 kolayla\u015ft\u0131racak g\u00f6rsellerle desteklenmelidir.' }
                    ]
                },
                {
                    id: '6.2',
                    title: 'G\u00f6rsel ve Yaz\u0131l\u0131 Unsurlar',
                    items: [
                        { id: '6.2.1', text: '\u00dcnite/tema/\u00f6\u011frenme alan\u0131 veya konu ba\u015f\u0131nda yer alan g\u00f6rsel, \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131 veya konuyu temsil etmelidir.' },
                        { id: '6.2.2', text: '\u00d6\u011fretim program\u0131nda yer alan \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131 \u00fcnite/tema/\u00f6\u011frenme alan\u0131 ba\u015flar\u0131nda g\u00f6rsel \u00f6zetleyicilerle sunulmal\u0131d\u0131r.' },
                        { id: '6.2.3', text: 'G\u00f6rseller anla\u015f\u0131l\u0131r ve net olmal\u0131d\u0131r.' },
                        { id: '6.2.4', text: 'Tasar\u0131msal \u00f6gelerdeki \u00e7izgi, boyut, doku, renk, \u0131\u015f\u0131k, g\u00f6lge, tonlama, perspektif vb. unsurlar \u00f6\u011frenmeye katk\u0131 sa\u011flayacak \u015fekilde kullan\u0131lmal\u0131d\u0131r.' },
                        { id: '6.2.5', text: 'G\u00f6rsel ve g\u00f6rseli olu\u015fturan \u00f6geler hata i\u00e7ermemelidir.' },
                        { id: '6.2.6', text: 'Yaz\u0131l\u0131 unsurlar, genel tasar\u0131m ilkelerine ve Y\u00f6netmelik\u2019te belirlenmi\u015f ilkelere uygun olmal\u0131d\u0131r.' }
                    ]
                }
            ]
        },
        {
            id: '7',
            title: 'E-\u0130\u00e7eriklerin Kapsam ve Tasar\u0131m\u0131n\u0131n Uygunlu\u011fu',
            shortTitle: 'E-\u0130\u00e7erik',
            color: '#06b6d4',
            subs: [
                {
                    id: '7.1',
                    title: 'Genel \u0130lkeler',
                    items: [
                        { id: '7.1.1', text: 'E\u011fitim ara\u00e7lar\u0131 ilgili \u00f6\u011fretim program\u0131nda \u00f6ng\u00f6r\u00fclen ve \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131yla ili\u015fkili bilgi, beceri, e\u011filim ve de\u011ferlerin geli\u015ftirilmesine katk\u0131 sunacak e-i\u00e7eriklerle desteklenmelidir.' },
                        { id: '7.1.2', text: 'E-i\u00e7erikler \u00f6\u011frencilerin \u00f6\u011frenme f\u0131rsatlar\u0131n\u0131 art\u0131racak \u00e7e\u015fitlilik ve nitelikte haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '7.1.3', text: 'E-i\u00e7erikler dersin t\u00fcr\u00fc ve ilgili \u00fcnite/tema/\u00f6\u011frenme alanlar\u0131 dikkate al\u0131narak uygun ya\u015f/s\u0131n\u0131f seviyesine uygun haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '7.1.4', text: 'Karekodlar genel tasar\u0131ma uygun yerle\u015ftirilmelidir.' },
                        { id: '7.1.5', text: 'E\u011fitim arac\u0131n\u0131n t\u00fcm \u00fcnite/tema/\u00f6\u011frenme alanlar\u0131nda yer vermek \u00fczere dersin \u00f6zelli\u011fine g\u00f6re \u00fcnite/tema/\u00f6\u011frenme alanlar\u0131n\u0131 destekleyen \u00f6zet e-i\u00e7erikler haz\u0131rlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '7.2',
                    title: 'Aray\u00fcz Tasar\u0131m\u0131 ve Kullan\u0131labilirlik',
                    items: [
                        { id: '7.2.1', text: 'E-i\u00e7erikler sorunsuz bir \u015fekilde \u00e7al\u0131\u015fmal\u0131d\u0131r.' },
                        { id: '7.2.2', text: 'E-i\u00e7erikler genel aray\u00fcz tasar\u0131m ilkelerine uygun haz\u0131rlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '7.3',
                    title: 'Ses ve G\u00f6r\u00fcnt\u00fc Kalitesi',
                    items: [
                        { id: '7.3.1', text: 'E-i\u00e7eriklerde kullan\u0131lan ses ve g\u00f6r\u00fcnt\u00fcler uygun nitelikte olmal\u0131d\u0131r.' },
                        { id: '7.3.2', text: 'Video ve foto\u011fraflar\u0131n g\u00f6rsel b\u00fct\u00fcnl\u00fc\u011f\u00fc olmal\u0131 ve estetik kalitesi y\u00fcksek olmal\u0131d\u0131r.' },
                        { id: '7.3.3', text: 'Video ve g\u00f6rseller net, y\u00fcksek \u00e7\u00f6z\u00fcn\u00fcrl\u00fck ve kalitede olmal\u0131d\u0131r.' },
                        { id: '7.3.4', text: 'Seslerin ve videolar\u0131n uzunlu\u011fu i\u00e7eri\u011fin amac\u0131na uygun olmal\u0131d\u0131r.' },
                        { id: '7.3.5', text: '\u00dc\u00e7 boyutlu modellerde karakterler, dokular vb. yap\u0131lar\u0131n detaylar\u0131 do\u011fru bir bi\u00e7imde verilmelidir.' }
                    ]
                },
                {
                    id: '7.4',
                    title: 'G\u00fcvenlik, G\u00fcncellik ve Uyumluluk',
                    items: [
                        { id: '7.4.1', text: 'E-i\u00e7erikler zararl\u0131 yaz\u0131l\u0131mlar i\u00e7ermemelidir.' },
                        { id: '7.4.2', text: 'E-i\u00e7erikler sunuldu\u011fu ortama ve duyarl\u0131 tasar\u0131m ilkelerine uygun \u015fekilde haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '7.4.3', text: 'E-i\u00e7erikler; uluslararas\u0131 a\u00e7\u0131k kaynakl\u0131 e-i\u00e7erik standart ve belirtimlerine uygun olarak haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '7.4.4', text: 'E-i\u00e7erikler g\u00fcncel teknolojilere uygun olarak geli\u015ftirilmelidir.' },
                        { id: '7.4.5', text: 'E-i\u00e7eriklerde T\u00fcrk\u00e7e karakter setleri kullan\u0131lmal\u0131d\u0131r.' },
                        { id: '7.4.6', text: 'Sanal ger\u00e7eklik, art\u0131r\u0131lm\u0131\u015f ger\u00e7eklik gibi etkile\u015fimli i\u00e7eriklerin \u00e7evre birimleri standartlara uygun olarak tasarlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '7.5',
                    title: 'Eri\u015filebilirlik',
                    items: [
                        { id: '7.5.1', text: 'E-i\u00e7erikler eri\u015filebilir olmal\u0131d\u0131r.' },
                        { id: '7.5.2', text: 'Sesli anlat\u0131m bulunan i\u00e7erikler (video, animasyon vb.) i\u00e7in alt yaz\u0131 haz\u0131rlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '7.6',
                    title: 'E\u011fitsel Tasar\u0131m',
                    items: [
                        { id: '7.6.1', text: '\u0130\u00e7erik, mant\u0131kl\u0131 ve tutarl\u0131 bir \u015fekilde organize edilmi\u015f olmal\u0131, net bir ba\u015flang\u0131c\u0131 ve sonu olmal\u0131d\u0131r.' },
                        { id: '7.6.2', text: '\u0130\u00e7erik, e-i\u00e7eri\u011fin t\u00fcr\u00fcne ba\u011fl\u0131 olarak \u00f6\u011frencilerin aktif olarak kat\u0131lmas\u0131n\u0131 te\u015fvik eden etkile\u015fimli \u00f6geler i\u00e7ermelidir.' },
                        { id: '7.6.3', text: 'E-i\u00e7eriklerde bili\u015fsel y\u00fck dengesi etkili bir \u00f6\u011fretim sa\u011flayacak nitelikte tasarlanmal\u0131d\u0131r.' },
                        { id: '7.6.4', text: 'Etkile\u015fimli i\u00e7eriklerde e-i\u00e7eri\u011fin t\u00fcr\u00fc, konusu ve \u00f6\u011frenen \u00f6zelliklerine uygun geri bildirimlere yer verilmelidir.' }
                    ]
                }
            ]
        },
        {
            id: '8',
            title: '\u00d6l\u00e7me ve De\u011ferlendirme S\u00fcrecinin Uygunlu\u011fu',
            shortTitle: '\u00d6l\u00e7me ve De\u011f.',
            color: '#f97316',
            subs: [
                {
                    id: '8.1',
                    title: 'Temel \u0130lkeler',
                    items: [
                        { id: '8.1.1', text: 'Her t\u00fcrl\u00fc soru ve etkinlik \u00f6l\u00e7me ve de\u011ferlendirme ilkelerine ve ilgili mevzuata uygun olarak haz\u0131rlanmal\u0131d\u0131r.' },
                        { id: '8.1.2', text: '\u0130\u00e7erikte yer alan etkinlik, \u00f6rnek soru ve \u00e7\u00f6z\u00fcmleri, performans g\u00f6revleri, ara\u015ft\u0131rma sorular\u0131, uygulamalar, \u00f6l\u00e7me ve de\u011ferlendirmeye y\u00f6nelik sorular hata veya eksiklik i\u00e7ermemelidir.' },
                        { id: '8.1.3', text: 'Cevap anahtar\u0131 eksik veya hatal\u0131 olmamal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '8.2',
                    title: '\u00d6\u011frenme Kan\u0131tlar\u0131na Uygunluk',
                    items: [
                        { id: '8.2.1', text: '\u0130\u00e7erikte kullan\u0131lan \u00f6l\u00e7me ve de\u011ferlendirme ara\u00e7lar\u0131n\u0131n tasar\u0131m\u0131nda ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131n\u0131n \u00f6\u011frenme kan\u0131tlar\u0131 b\u00f6l\u00fcmleri dikkate al\u0131nmal\u0131d\u0131r.' },
                        { id: '8.2.2', text: '\u00d6\u011frenme kan\u0131tlar\u0131na y\u00f6nelik etkinlikler \u00f6\u011frenme \u00e7\u0131kt\u0131lar\u0131n\u0131 destekleyen, beceri ve s\u00fcrec odakl\u0131 bir bi\u00e7imde tasarlanmal\u0131d\u0131r.' },
                        { id: '8.2.3', text: '\u0130\u00e7erikte konuya haz\u0131rlay\u0131c\u0131 ve \u00f6\u011frenilenleri peki\u015ftirici etkinlik ve sorulara yer verilmelidir.' },
                        { id: '8.2.4', text: '\u00d6l\u00e7me ve de\u011ferlendirmeye y\u00f6nelik etkinlikler \u00f6\u011frencinin seviyesine uygun olmal\u0131d\u0131r.' },
                        { id: '8.2.5', text: '\u00d6l\u00e7me ve de\u011ferlendirmeye y\u00f6nelik etkinlikler basitten karma\u015f\u0131\u011fa, kolaydan zora olacak \u015fekilde s\u0131ralanmal\u0131d\u0131r.' },
                        { id: '8.2.6', text: '\u00d6l\u00e7me ve de\u011ferlendirmeye y\u00f6nelik etkinlikler ilgi \u00e7ekici, yak\u0131n ve uzak \u00e7evrede kar\u015f\u0131la\u015f\u0131lan durumlar g\u00f6z \u00f6n\u00fcnde bulundurularak tasarlanmal\u0131d\u0131r.' },
                        { id: '8.2.7', text: '\u00d6l\u00e7me ve de\u011ferlendirmeye y\u00f6nelik etkinlikler \u00f6\u011frencilerin yetenek farkl\u0131l\u0131klar\u0131, \u00f6zel gereksinimleri ve \u00f6\u011frenme profilleri g\u00f6z \u00f6n\u00fcnde bulundurularak \u00e7e\u015fitlendirilmi\u015f ve \u00e7ok y\u00f6nl\u00fc bir bi\u00e7imde tasarlanmal\u0131d\u0131r.' },
                        { id: '8.2.8', text: '\u0130lgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131nda yer alan \u00f6\u011frenme kan\u0131tlar\u0131n\u0131n y\u00f6ntem ve tekniklerinde \u00e7e\u015fitlilik sa\u011flanmal\u0131d\u0131r.' },
                        { id: '8.2.9', text: '\u00d6\u011frenme-\u00f6\u011fretme uygulamalar\u0131 b\u00f6l\u00fcmleri ile \u00f6\u011frenme kan\u0131tlar\u0131 b\u00f6l\u00fcmlerinde \u201cistenebilir, verilebilir, vb.\u201d \u015feklinde biten, \u00f6l\u00e7me de\u011ferlendirme s\u00fcrecine ili\u015fkin konunun ve s\u0131n\u0131f\u0131n \u015fartlar\u0131 g\u00f6z \u00f6n\u00fcnde bulundurularak yaz\u0131lm\u0131\u015f olan \u00f6l\u00e7me ve de\u011ferlendirme ara\u00e7lar\u0131na e\u011fitim arac\u0131nda yer verilebilir.' },
                        { id: '8.2.10', text: '\u00d6l\u00e7me de\u011ferlendirmeye y\u00f6nelik etkinlikler ilgili \u00fcnite/tema/\u00f6\u011frenme alan\u0131 dikkate al\u0131narak m\u00fcmk\u00fcn oldu\u011funca s\u0131n\u0131f ortam\u0131nda yap\u0131lacak \u015fekilde tasarlanmal\u0131d\u0131r.' },
                        { id: '8.2.11', text: 'Performans g\u00f6revleri ger\u00e7ek hayatla ili\u015fkili, bilginin transferine imk\u00e2n sa\u011flayan, \u00f6\u011frenci i\u00e7in anlaml\u0131 ve ilgi \u00e7ekici olan, bireysel ilgi ve ihtiya\u00e7lara g\u00f6re farkl\u0131la\u015fabilme konusunda esnekli\u011fe imk\u00e2n verecek \u015fekilde tasarlanmal\u0131d\u0131r.' }
                    ]
                },
                {
                    id: '8.3',
                    title: 'E-\u0130\u00e7erik \u00d6l\u00e7me ve De\u011ferlendirme \u0130\u00e7erikleri',
                    items: [
                        { id: '8.3.1', text: '\u00dcnite/Tema/\u00d6\u011frenme alan\u0131 ile ilgili \u00f6\u011frenme kan\u0131tlar\u0131n\u0131 destekleyecek ek etkinlik veya sorular e-i\u00e7erik olarak haz\u0131rlanmal\u0131d\u0131r.' }
                    ]
                }
            ]
        }
    ];

    /* ========================================================================
       CUSTOM CRITERIA - localStorage
       ======================================================================== */
    function loadCustom() {
        try { customCriteria = JSON.parse(localStorage.getItem('eit-custom-criteria') || '[]'); } catch (e) { customCriteria = []; }
    }
    function saveCustom() {
        localStorage.setItem('eit-custom-criteria', JSON.stringify(customCriteria));
    }

    /* ========================================================================
       HELPERS
       ======================================================================== */
    function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

    function getTotalCount() {
        var c = 0;
        categories.forEach(function (cat) { cat.subs.forEach(function (s) { c += s.items.length; }); });
        return c;
    }

    /* ========================================================================
       INIT
       ======================================================================== */
    document.addEventListener('DOMContentLoaded', function () {
        $view = document.getElementById('criteriaView');
        $btn = document.getElementById('criteriaBtn');
        if (!$btn || !$view) return;
        loadCustom();
        if ($btn && $btn.tagName === 'BUTTON') $btn.addEventListener('click', openCriteria);
        // Header bilgi butonu
        var critHdr = document.getElementById('criteriaHeaderBtn');
        if (critHdr) critHdr.addEventListener('click', openCriteria);
    });

    /* ========================================================================
       OPEN CRITERIA VIEW
       ======================================================================== */
    function openCriteria() {
        ['dashOverview', 'bookGrid', 'detailPage', 'emptyState', 'filterPills', 'resultsInfo', 'reportsView', 'adminView', 'eicerikTablosuView', 'gorevlerView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        ['reportsBtn', 'adminPanelBtn', 'eicerikTablosuBtn', 'gorevlerBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $view.style.display = '';
        $btn.classList.add('active');
        document.getElementById('pageTitle').textContent = 'E-\u0130\u00e7erik \u0130nceleme Kriterleri';
        var bc = document.getElementById('breadcrumb');
        if (bc) bc.textContent = '';
        renderCriteria();
        if (window.eitPushState) window.eitPushState('criteria');
    }

    /* ========================================================================
       RENDER MAIN LAYOUT
       ======================================================================== */
    function renderCriteria() {
        var h = '<div class="criteria-layout">';

        /* ---- Left Nav ---- */
        h += '<div class="criteria-nav">';

        // Search
        h += '<div class="criteria-search">';
        h += '<svg class="criteria-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
        h += '<input type="text" id="criteriaSearch" placeholder="Kriter ara..." value="' + esc(searchQuery) + '">';
        h += '</div>';

        // Stats
        h += '<div class="criteria-stats">';
        h += '<span>' + getTotalCount() + ' kriter</span>';
        h += '<span>\u00b7</span>';
        h += '<span>8 kategori</span>';
        if (customCriteria.length > 0) {
            h += '<span>\u00b7</span>';
            h += '<span>' + customCriteria.length + ' \u00f6zel</span>';
        }
        h += '</div>';

        // Category list
        categories.forEach(function (cat) {
            var count = 0;
            cat.subs.forEach(function (s) { count += s.items.length; });
            var isActive = activeCategory === cat.id;
            h += '<div class="criteria-nav-item' + (isActive ? ' active' : '') + '" data-cat="' + cat.id + '" style="--cat-color:' + cat.color + '">';
            h += '<span class="criteria-nav-dot" style="background:' + cat.color + '"></span>';
            h += '<span class="criteria-nav-label">' + cat.id + '. ' + esc(cat.shortTitle || cat.title) + '</span>';
            h += '<span class="criteria-nav-count">' + count + '</span>';
            h += '</div>';
        });

        // Custom criteria nav item
        if (customCriteria.length > 0) {
            var isCustomActive = activeCategory === 'custom';
            h += '<div class="criteria-nav-item' + (isCustomActive ? ' active' : '') + '" data-cat="custom" style="--cat-color:#8b5cf6">';
            h += '<span class="criteria-nav-dot" style="background:#8b5cf6"></span>';
            h += '<span class="criteria-nav-label">\u00d6zel Kriterler</span>';
            h += '<span class="criteria-nav-count">' + customCriteria.length + '</span>';
            h += '</div>';
        }

        h += '</div>'; // end .criteria-nav

        /* ---- Right Content ---- */
        h += '<div class="criteria-content">';

        if (searchQuery) {
            h += renderSearchResults();
        } else if (activeCategory === 'custom') {
            h += renderCustomCriteria();
        } else {
            var cat = categories.find(function (c) { return c.id === activeCategory; });
            if (cat) h += renderCategory(cat);
        }

        // Add custom criteria section (always at bottom)
        h += '<div class="criteria-add-section">';
        h += '<h4>\u00d6zel Kriter Ekle</h4>';
        h += '<div class="criteria-add-form">';
        h += '<input type="text" id="customCriteriaInput" class="criteria-add-input" placeholder="Kriter metnini yaz\u0131n...">';
        h += '<button class="criteria-add-btn" id="addCustomBtn">';
        h += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        h += ' Ekle</button>';
        h += '</div>';
        h += '</div>';

        h += '</div>'; // end .criteria-content
        h += '</div>'; // end .criteria-layout

        $view.innerHTML = h;
        bindEvents();
    }

    /* ========================================================================
       RENDER CATEGORY
       ======================================================================== */
    function renderCategory(cat) {
        var h = '<div class="criteria-header" style="--cat-color:' + cat.color + '">';
        h += '<span class="criteria-header-num" style="background:' + cat.color + '18;color:' + cat.color + '">' + cat.id + '</span>';
        h += '<h2>' + esc(cat.title) + '</h2>';
        h += '</div>';

        cat.subs.forEach(function (sub) {
            h += '<div class="criteria-sub">';
            h += '<h3 class="criteria-sub-title">';
            h += '<span class="criteria-sub-id" style="color:' + cat.color + '">' + sub.id + '</span> ';
            h += esc(sub.title);
            h += '<span class="criteria-sub-count">' + sub.items.length + ' kriter</span>';
            h += '</h3>';
            h += '<div class="criteria-items">';
            sub.items.forEach(function (item) {
                h += '<div class="criteria-item">';
                h += '<span class="criteria-item-id" style="background:' + cat.color + '12;color:' + cat.color + ';border:1px solid ' + cat.color + '30">' + item.id + '</span>';
                h += '<span class="criteria-item-text">' + esc(item.text) + '</span>';
                h += '</div>';
            });
            h += '</div>';
            h += '</div>';
        });

        return h;
    }

    /* ========================================================================
       RENDER SEARCH RESULTS
       ======================================================================== */
    function renderSearchResults() {
        var q = searchQuery.toLowerCase();
        var results = [];
        categories.forEach(function (cat) {
            cat.subs.forEach(function (sub) {
                sub.items.forEach(function (item) {
                    if (item.id.toLowerCase().indexOf(q) > -1 || item.text.toLowerCase().indexOf(q) > -1) {
                        results.push({ cat: cat, sub: sub, item: item });
                    }
                });
            });
        });
        // Also search custom criteria
        customCriteria.forEach(function (c, idx) {
            if (c.text.toLowerCase().indexOf(q) > -1) {
                results.push({
                    cat: { id: '\u00d6', title: '\u00d6zel Kriter', color: '#8b5cf6' },
                    sub: { title: '' },
                    item: { id: '\u00d6' + (idx + 1), text: c.text }
                });
            }
        });

        var h = '<div class="criteria-header">';
        h += '<h2>Arama Sonu\u00e7lar\u0131: \u201c' + esc(searchQuery) + '\u201d (' + results.length + ' sonu\u00e7)</h2>';
        h += '</div>';

        if (results.length === 0) {
            h += '<div class="criteria-empty">';
            h += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
            h += '<p>Kriter bulunamad\u0131.</p>';
            h += '</div>';
        } else {
            h += '<div class="criteria-items">';
            results.forEach(function (r) {
                h += '<div class="criteria-item">';
                h += '<span class="criteria-item-id" style="background:' + r.cat.color + '12;color:' + r.cat.color + ';border:1px solid ' + r.cat.color + '30">' + r.item.id + '</span>';
                h += '<span class="criteria-item-text">' + highlightText(esc(r.item.text), searchQuery) + '</span>';
                h += '</div>';
            });
            h += '</div>';
        }
        return h;
    }

    /* ========================================================================
       RENDER CUSTOM CRITERIA
       ======================================================================== */
    function renderCustomCriteria() {
        var h = '<div class="criteria-header" style="--cat-color:#8b5cf6">';
        h += '<span class="criteria-header-num" style="background:rgba(139,92,246,.12);color:#8b5cf6">\u00d6</span>';
        h += '<h2>\u00d6zel Kriterler</h2>';
        h += '</div>';

        if (customCriteria.length === 0) {
            h += '<div class="criteria-empty">';
            h += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
            h += '<p>Hen\u00fcz \u00f6zel kriter eklenmemi\u015f.</p>';
            h += '</div>';
        } else {
            h += '<div class="criteria-items">';
            customCriteria.forEach(function (c, i) {
                h += '<div class="criteria-item">';
                h += '<span class="criteria-item-id" style="background:rgba(139,92,246,.1);color:#8b5cf6;border:1px solid rgba(139,92,246,.25)">\u00d6' + (i + 1) + '</span>';
                h += '<span class="criteria-item-text">' + esc(c.text) + '</span>';
                h += '<button class="criteria-item-del" data-idx="' + i + '" title="Sil">';
                h += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                h += '</button>';
                h += '</div>';
            });
            h += '</div>';
        }
        return h;
    }

    /* ========================================================================
       HIGHLIGHT TEXT
       ======================================================================== */
    function highlightText(text, query) {
        if (!query) return text;
        var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /* ========================================================================
       EVENT BINDING
       ======================================================================== */
    function bindEvents() {
        // Category nav clicks
        var navItems = $view.querySelectorAll('.criteria-nav-item');
        for (var n = 0; n < navItems.length; n++) {
            navItems[n].addEventListener('click', function () {
                activeCategory = this.dataset.cat;
                searchQuery = '';
                renderCriteria();
            });
        }

        // Search
        var searchInput = document.getElementById('criteriaSearch');
        if (searchInput) {
            var debounceTimer;
            searchInput.addEventListener('input', function () {
                var self = this;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function () {
                    searchQuery = self.value.trim();
                    if (searchQuery) {
                        activeCategory = '';
                    } else if (!activeCategory) {
                        activeCategory = '1';
                    }
                    renderCriteria();
                    // Re-focus search input after render
                    var newInput = document.getElementById('criteriaSearch');
                    if (newInput) {
                        newInput.focus();
                        newInput.selectionStart = newInput.selectionEnd = newInput.value.length;
                    }
                }, 200);
            });
        }

        // Add custom criteria
        var addBtn = document.getElementById('addCustomBtn');
        var addInput = document.getElementById('customCriteriaInput');
        if (addBtn && addInput) {
            addBtn.addEventListener('click', function () {
                var text = addInput.value.trim();
                if (!text) return;
                customCriteria.push({ text: text, date: new Date().toISOString() });
                saveCustom();
                addInput.value = '';
                activeCategory = 'custom';
                renderCriteria();
            });
            addInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') addBtn.click();
            });
        }

        // Delete custom criteria
        var delBtns = $view.querySelectorAll('.criteria-item-del');
        for (var d = 0; d < delBtns.length; d++) {
            delBtns[d].addEventListener('click', function (e) {
                e.stopPropagation();
                var idx = parseInt(this.dataset.idx);
                if (isNaN(idx)) return;
                customCriteria.splice(idx, 1);
                saveCustom();
                if (customCriteria.length === 0) activeCategory = '1';
                renderCriteria();
            });
        }
    }

})();
