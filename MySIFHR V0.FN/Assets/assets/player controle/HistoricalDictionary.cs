using UnityEngine;

public static class HistoricalDictionary
{
    private static string[][] historicalQuestions = {
        // Sciences et mathématiques
        new string[] {
            "Quelles sont les contributions d'Al-Khwarizmi aux mathématiques ?",
            "Parle-moi d'Ibn Sina (Avicenne) et de ses contributions à la médecine",
            "Comment Alhazen (Ibn al-Haytham) a-t-il révolutionné l'optique ?",
            "Quelle était l'importance de l'observatoire de Maragha ?",
            "Comment le système numérique indo-arabe s'est-il répandu ?",
            "Qu'est-ce que l'algèbre et qui l'a fondée ?",
            "Parle-moi des contributions d'Omar Khayyam aux mathématiques",
            "Comment la trigonométrie a-t-elle été développée dans le monde musulman ?"
        },
        
        // Architecture et art
        new string[] {
            "Décris-moi la beauté de la mosquée de Cordoue",
            "Qu'est-ce qui rend l'Alhambra de Grenade si exceptionnel ?",
            "Parle-moi des merveilles architecturales de Samarcande",
            "Comment l'art islamique exprime-t-il l'infini divin ?",
            "Qu'est-ce que l'arabesque en art islamique ?",
            "Parle-moi de la calligraphie coufique",
            "Comment les jardins persans reflètent-ils le paradis ?",
            "Quelle est l'importance des tapis orientaux dans l'art islamique ?"
        },
        
        // Philosophie et pensée
        new string[] {
            "Qui était Al-Farabi et quelle était sa vision de la cité idéale ?",
            "Comment Averroès (Ibn Rushd) a-t-il commenté Aristote ?",
            "Parle-moi de la pensée d'Al-Ghazali et de son influence",
            "Quelle était la place de la philosophie dans le monde islamique classique ?",
            "Quelle était la controverse entre Al-Ghazali et les philosophes ?",
            "Parle-moi de la falsafa (philosophie islamique)",
            "Comment la pensée grecque a-t-elle été intégrée dans le monde islamique ?"
        },
        
        // Histoire et civilisations
        new string[] {
            "Parle-moi de la grandeur de la civilisation arabo-musulmane à son apogée",
            "Qui était le calife Haroun al-Rachid et pourquoi est-il célèbre ?",
            "Raconte-moi l'histoire de la Maison de la Sagesse à Bagdad",
            "Comment les savants musulmans ont-ils préservé et développé le savoir antique ?",
            "Qui était Saladin et quel fut son rôle dans les croisades ?",
            "Raconte-moi l'histoire de Bagdad, la cité de la paix",
            "Comment était la vie à Cordoue sous le califat omeyyade ?",
            "Parle-moi de l'importance de Damas dans l'histoire islamique"
        },
        
        // Littérature et culture
        new string[] {
            "Raconte-moi une histoire des Mille et Une Nuits",
            "Qui était Al-Mutanabbi et pourquoi est-il célèbre ?",
            "Parle-moi de la poésie soufie de Rumi",
            "Comment les contes de Kalila wa Dimna ont-ils voyagé à travers le monde ?",
            "Qu'est-ce que la musique arabo-andalouse ?",
            "Parle-moi de la tradition des miniatures persanes",
            "Comment la céramique islamique s'est-elle développée ?"
        },
        
        // Médecine et santé
        new string[] {
            "Comment les hôpitaux (bimaristans) fonctionnaient-ils dans le monde musulman médiéval ?",
            "Quelles étaient les avancées médicales d'Al-Razi (Rhazès) ?",
            "Parle-moi de l'usage des plantes médicinales dans la médecine arabe",
            "Comment les médecins arabes ont-ils traité les maladies ophtalmiques ?"
        },
        
        // Géographie et exploration
        new string[] {
            "Qui était Ibn Battuta et où a-t-il voyagé ?",
            "Comment Al-Idrisi a-t-il cartographié le monde connu ?",
            "Parle-moi des grandes routes commerciales du monde musulman médiéval",
            "Quelle était l'importance de la route de la soie pour le savoir ?"
        },
        
        // Astronomie
        new string[] {
            "Quelles étaient les découvertes astronomiques d'Al-Battani ?",
            "Comment l'astrolabe a-t-il été perfectionné par les savants musulmans ?",
            "Parle-moi des tables astronomiques (zij) et de leur importance",
            "Quelle était la conception du cosmos dans l'astronomie islamique ?"
        },
        
        // Vie quotidienne
        new string[] {
            "Comment fonctionnaient les marchés (souks) dans les villes médiévales arabes ?",
            "Quelle était la place des bains publics (hammams) dans la société ?",
            "Parle-moi de l'éducation dans les madrasas",
            "Comment l'eau était-elle gérée dans les villes du désert ?"
        },
        
        // Spiritualité
        new string[] {
            "Qu'est-ce que le soufisme et quels sont ses enseignements ?",
            "Parle-moi de la tradition du dhikr (rappel de Dieu)",
            "Qui était Ibn Arabi et quelle était sa doctrine de l'Unité de l'Être ?",
            "Comment la calligraphie arabe exprime-t-elle le sacré ?"
        }
    };

    public static string[] GetRandomQuestion()
    {
        if (historicalQuestions.Length == 0) 
            return new string[] { "Parle-moi de la civilisation arabo-musulmane" };
        
        // CORRECTION ICI : Utiliser UnityEngine.Random explicitement
        int categoryIndex = UnityEngine.Random.Range(0, historicalQuestions.Length);
        return historicalQuestions[categoryIndex];
    }

    public static string GetQuestionByCategory(int categoryIndex)
    {
        if (categoryIndex < 0 || categoryIndex >= historicalQuestions.Length)
            return "Parle-moi de la civilisation arabo-musulmane";
        
        string[] category = historicalQuestions[categoryIndex];
        if (category.Length == 0) 
            return "Parle-moi de la civilisation arabo-musulmane";
        
        // CORRECTION ICI : Utiliser UnityEngine.Random explicitement
        return category[UnityEngine.Random.Range(0, category.Length)];
    }

    public static string[] GetAllCategories()
    {
        return new string[] {
            "Sciences et Mathématiques",
            "Architecture et Art", 
            "Philosophie et Pensée",
            "Histoire et Civilisations",
            "Littérature et Culture",
            "Médecine et Santé",
            "Géographie et Exploration",
            "Astronomie",
            "Vie Quotidienne",
            "Spiritualité"
        };
    }

    public static int GetCategoryCount()
    {
        return historicalQuestions.Length;
    }

    public static int GetTotalQuestionCount()
    {
        int total = 0;
        foreach (var category in historicalQuestions)
        {
            total += category.Length;
        }
        return total;
    }
}