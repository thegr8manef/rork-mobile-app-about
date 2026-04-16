import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Text,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { Calendar } from "lucide-react-native";

import TText from "@/components/TText";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { BankingColors } from "@/constants/banking-colors";

type Props = {
  visible: boolean;
  activationDate: string;
  pickerDate: Date;
  onChangePickerDate: (d: Date) => void;
  onChangeDate: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isUpdatingCard: boolean;
  styles: any;
};

export default function RulesModal({
  visible,
  activationDate,
  pickerDate,
  onChangePickerDate,
  onChangeDate,
  onCancel,
  onConfirm,
  isUpdatingCard,
  styles,
}: Props) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { t } = useTranslation();

  const minimumDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const displayDate = useMemo(() => {
    if (!activationDate) return "";
    const parsed = parseBackendDate(activationDate) ?? pickerDate;
    return formatPrettyDate(parsed);
  }, [activationDate, pickerDate]);

  const canValidate = accepted && !!activationDate && !isUpdatingCard;

  const handleCancel = () => {
    setAccepted(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.rulesContainer}>
        <CustomHeader
          onBack={handleCancel}
          tKey="cards.usageRulesTitle"
          showBackButton
        />

        <ScrollView
          style={styles.rulesContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.rulesText}>
            LA FONCTIONNALITÉ D'ACTIVATION PERMET L'UTILISATION DE VOTRE CARTE
            INTERNATIONALE ABT SUR LES DIVERS MODES DE PAIEMENTS NON SÉCURISÉS.
            VEUILLEZ LIRE ATTENTIVEMENT CES RÈGLES D'UTILISATION AVANT
            D'UTILISER CETTE FONCTIONNALITÉ :
          </Text>

          <Text style={styles.rulesSectionTitle}>1. ACTIVATION</Text>
          <Text style={styles.rulesText}>
            {
              "   a. LORSQUE VOUS ACTIVEZ CE MODE DE PAIEMENT, VOUS DÉCLAREZ AVOIR PRIS CONNAISSANCE DU NIVEAU DE SÉCURITÉ RÉDUIT POUR VOS TRANSACTIONS À L'ÉTRANGER EN LIGNE POUR CERTAINS SITES.\n   b. VOUS ÊTES RESPONSABLE DE TOUTE TRANSACTION EFFECTUÉE UNE FOIS QUE VOUS AVEZ ACTIVÉ CETTE FONCTIONNALITÉ.\n   c. LA RESPONSABILITÉ D'ATTIJARI BANK EST ENTIÈREMENT DÉSENGAGÉE DE TOUT PRÉJUDICE RÉSULTANT DE L'UTILISATION DE CETTE FONCTIONNALITÉ SUR DES SITES NON FIABLES."
            }
          </Text>

          <Text style={styles.rulesSectionTitle}>
            1. RESPONSABILITÉS DE L'UTILISATEUR
          </Text>
          <Text style={styles.rulesText}>
            {
              "   a. VOUS ÊTES RESPONSABLE DE LA GESTION ET DE LA SÉCURITÉ DE VOTRE COMPTE UTILISATEUR.\n   b. VOUS DEVEZ GARDER VOS INFORMATIONS D'IDENTIFICATION CONFIDENTIELLES ET NE PAS LES DIVULGUER À DES TIERS.\n   c. ATTIJARI BANK NE SERA PAS TENUE RESPONSABLE DES DOMMAGES, DES PERTES OU DES FRAIS RÉSULTANT DE L'UTILISATION DE CETTE FONCTIONNALITÉ."
            }
          </Text>

          <Text style={styles.rulesSectionTitle}>
            1. CLAUSE DE NON-RESPONSABILITÉ
          </Text>
          <Text style={styles.rulesText}>
            {
              "   a. ATTIJARI BANK DEMEURE ÉTRANGÈRE À TOUT DIFFÉREND OU MALENTENDU QUI POURRAIT NAÎTRE EN RAPPORT AVEC LES OPÉRATIONS EFFECTUÉES SUITE À L'UTILISATION DE CETTE FONCTIONNALITÉ.\n   b. OUTRE SON HABITUELLE OBLIGATION DE DILIGENCE EN MATIÈRE D'EXÉCUTION D'OPÉRATIONS ET DE SÉCURITÉ, ATTIJARI BANK ASSUME UNE OBLIGATION DE MOYENS EN CE QUI CONCERNE LA PRISE EN CHARGE DES OPÉRATIONS EFFECTUÉES, SA RESPONSABILITÉ NE SAURAIT EN AUCUN CAS ÊTRE RECHERCHÉE, LORSQUE L'INEXÉCUTION DE SES OBLIGATIONS RÉSULTE DE L'UTILISATION DE CETTE FONCTIONNALITÉ."
            }
          </Text>
        </ScrollView>

        <View style={localStyles.bottomSection}>
          <View style={localStyles.acceptRow}>
            <Switch
              value={accepted}
              onValueChange={setAccepted}
              trackColor={{
                false: BankingColors.borderGray,
                true: BankingColors.primary,
              }}
              thumbColor={BankingColors.white}
            />
            <TText
              style={localStyles.acceptText}
              tKey="cards.activateUnsecureNoteConfirm"
            />
          </View>

          <View style={styles.dateInputContainer}>
            <TText style={styles.dateInputLabel} tKey="cards.activationUntil" />

            <TouchableOpacity
              style={styles.dateInputWrapper}
              onPress={() => setOpen(true)}
              activeOpacity={0.8}
            >
              <TextInput
                style={styles.dateInput}
                value={displayDate}
                editable={false}
                placeholder=""
                contextMenuHidden
              />
              <Calendar size={20} color={BankingColors.primary} />
            </TouchableOpacity>

            <TText style={styles.dateHint} tKey="cards.activationUntilHint" />
          </View>

          <DatePicker
            modal
            open={open}
            date={pickerDate}
            mode="date"
            minimumDate={minimumDate}
            onConfirm={(d) => {
              setOpen(false);
              onChangePickerDate(d);
              onChangeDate(formatBackendDate(d));
            }}
            onCancel={() => setOpen(false)}
            title={""}
            locale={selectedLanguage ?? undefined}
            confirmText={t("datePicker.confirmText")}
            cancelText={t("datePicker.cancelText")}
          />

          <View style={localStyles.buttonsRow}>
            <TouchableOpacity
              style={styles.rulesCancelButton}
              onPress={handleCancel}
            >
              <TText style={styles.rulesCancelButtonText} tKey="modal.cancel" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rulesActivateButton,
                !canValidate && localStyles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={!canValidate}
            >
              <TText
                style={styles.rulesActivateButtonText}
                tKey={isUpdatingCard ? "cards.processing" : "common.validate"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import { StyleSheet } from "react-native";
import { FontFamily } from "@/constants";
import { useTranslation } from "react-i18next";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

const localStyles = StyleSheet.create({
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: BankingColors.borderGray,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 26,
    backgroundColor: BankingColors.white,
  },
  acceptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 10,
  },
  acceptText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    lineHeight: 18,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

const formatBackendDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatPrettyDate = (d: Date) => {
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseBackendDate = (s?: string) => {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
};
