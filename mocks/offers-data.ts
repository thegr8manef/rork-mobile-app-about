import { Offer, OfferPromotion } from "@/types/banking";
import { TFunction } from "i18next";

export const getMockOffers = (t: TFunction): OfferPromotion[] => [
  {
    id: "1",
    title: t("story.title.cardFlex"),
    description: "",
    imageUri: require("../assets/stories/Flex-story.png"),
    backgroundColor: "#6366f1",
    category: "loan",
    actionLabel: "Découvrir",
    isNew: true,
  },
  {
    id: "2",
    title: t("story.title.TSF"),
    description: "",
    imageUri: require("../assets/stories/3.png"),
    backgroundColor: "#10b981",
    category: "savings",
    actionLabel: "Ouvrir un compte",
    isNew: true,
  },
  {
    id: "3",
    title: "Crédit تق-سيط",
    description: "Réalisez les projets qui vous tiennent à cœur en toute simplicité grâce au Crédit تق-سيط , une solution de financement souple, rapide et accessible à tous",
    imageUri: require("../assets/stories/1.png"),
    backgroundColor: "#f59e0b",
    category: "insurance",
    actionLabel: "En savoir plus",
    isNew: true,
  },
  {
    id: "4",
    title: "Attijari Up",
    description: "Découvrez Attijari Up, votre nouvelle application pour gérer vos comptes à distance, en toute sécurité.",
    imageUri:
      require("../assets/stories/image001.jpg"),
    backgroundColor: "#0ea5e9",
    category: "insurance",
    actionLabel: "Regarder",
    isNew: true,
  },
];

export const mockLoanOffers: Offer[] = [
  {
    id: "loan-1",
    title: "Crédit Auto",
    description: "Taux à partir de 4.9%",
    imageUri:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=600&fit=crop",
    backgroundColor: "#3b82f6",
    category: "loan",
    actionLabel: "Découvrir",
    isNew: true,
  },
  {
    id: "loan-2",
    title: "Crédit Immobilier",
    description: "Financez votre projet",
    imageUri:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=600&fit=crop",
    backgroundColor: "#8b5cf6",
    category: "loan",
    actionLabel: "Simuler",
  },
  {
    id: "loan-3",
    title: "Crédit Personnel",
    description: "Jusqu'à 50 000 USD",
    imageUri:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=600&fit=crop",
    backgroundColor: "#6366f1",
    category: "loan",
    actionLabel: "Demander",
  },
  {
    id: "loan-4",
    title: "Crédit Consommation",
    description: "Réponse en 24h",
    imageUri:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=600&fit=crop",
    backgroundColor: "#10b981",
    category: "loan",
    actionLabel: "En savoir plus",
    isNew: true,
  },
  {
    id: "loan-5",
    title: "Rachat de Crédits",
    description: "Regroupez vos prêts",
    imageUri:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=600&fit=crop",
    backgroundColor: "#f59e0b",
    category: "loan",
    actionLabel: "Calculer",
  },
];
