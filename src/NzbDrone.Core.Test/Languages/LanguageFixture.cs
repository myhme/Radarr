using FluentAssertions;
using NUnit.Framework;
using NzbDrone.Core.Languages;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.Languages
{
    [TestFixture]
    public class LanguageFixture : CoreTest
    {
        public static object[] FromIntCases =
            {
                new object[] { -2, Language.Original },
                new object[] { -1, Language.Any },
                new object[] { 0, Language.Unknown },
                new object[] { 1, Language.English },
                new object[] { 2, Language.French },
                new object[] { 3, Language.Spanish },
                new object[] { 4, Language.German },
                new object[] { 5, Language.Italian },
                new object[] { 6, Language.Danish },
                new object[] { 7, Language.Dutch },
                new object[] { 8, Language.Japanese },
                new object[] { 9, Language.Icelandic },
                new object[] { 10, Language.Chinese },
                new object[] { 11, Language.Russian },
                new object[] { 12, Language.Polish },
                new object[] { 13, Language.Vietnamese },
                new object[] { 14, Language.Swedish },
                new object[] { 15, Language.Norwegian },
                new object[] { 16, Language.Finnish },
                new object[] { 17, Language.Turkish },
                new object[] { 18, Language.Portuguese },
                new object[] { 19, Language.Flemish },
                new object[] { 20, Language.Greek },
                new object[] { 21, Language.Korean },
                new object[] { 22, Language.Hungarian },
                new object[] { 23, Language.Hebrew },
                new object[] { 24, Language.Lithuanian },
                new object[] { 25, Language.Czech },
                new object[] { 26, Language.Hindi },
                new object[] { 27, Language.Romanian },
                new object[] { 28, Language.Thai },
                new object[] { 29, Language.Bulgarian },
                new object[] { 30, Language.PortugueseBR },
                new object[] { 31, Language.Arabic },
                new object[] { 32, Language.Ukrainian },
                new object[] { 33, Language.Persian },
                new object[] { 34, Language.Bengali },
                new object[] { 35, Language.Slovak },
                new object[] { 36, Language.Latvian },
                new object[] { 37, Language.SpanishLatino },
                new object[] { 38, Language.Catalan },
                new object[] { 39, Language.Croatian },
                new object[] { 40, Language.Serbian },
                new object[] { 41, Language.Bosnian },
                new object[] { 42, Language.Estonian },
                new object[] { 43, Language.Tamil },
                new object[] { 44, Language.Indonesian },
                new object[] { 45, Language.Telugu },
                new object[] { 46, Language.Macedonian },
                new object[] { 47, Language.Slovenian },
                new object[] { 48, Language.Malayalam },
                new object[] { 49, Language.Kannada },
                new object[] { 50, Language.Albanian },
                new object[] { 51, Language.Afrikaans },
                new object[] { 52, Language.Marathi },
                new object[] { 53, Language.Tagalog },
                new object[] { 54, Language.Urdu },
                new object[] { 55, Language.Romansh },
                new object[] { 56, Language.Mongolian }
            };

        public static object[] ToIntCases =
            {
                new object[] { Language.Original, -2 },
                new object[] { Language.Any, -1 },
                new object[] { Language.Unknown, 0 },
                new object[] { Language.English, 1 },
                new object[] { Language.French, 2 },
                new object[] { Language.Spanish, 3 },
                new object[] { Language.German, 4 },
                new object[] { Language.Italian, 5 },
                new object[] { Language.Danish, 6 },
                new object[] { Language.Dutch, 7 },
                new object[] { Language.Japanese, 8 },
                new object[] { Language.Icelandic, 9 },
                new object[] { Language.Chinese, 10 },
                new object[] { Language.Russian, 11 },
                new object[] { Language.Polish, 12 },
                new object[] { Language.Vietnamese, 13 },
                new object[] { Language.Swedish, 14 },
                new object[] { Language.Norwegian, 15 },
                new object[] { Language.Finnish, 16 },
                new object[] { Language.Turkish, 17 },
                new object[] { Language.Portuguese, 18 },
                new object[] { Language.Flemish, 19 },
                new object[] { Language.Greek, 20 },
                new object[] { Language.Korean, 21 },
                new object[] { Language.Hungarian, 22 },
                new object[] { Language.Hebrew, 23 },
                new object[] { Language.Lithuanian, 24 },
                new object[] { Language.Czech, 25 },
                new object[] { Language.Hindi, 26 },
                new object[] { Language.Romanian, 27 },
                new object[] { Language.Thai, 28 },
                new object[] { Language.Bulgarian, 29 },
                new object[] { Language.PortugueseBR, 30 },
                new object[] { Language.Arabic, 31 },
                new object[] { Language.Ukrainian, 32 },
                new object[] { Language.Persian, 33 },
                new object[] { Language.Bengali, 34 },
                new object[] { Language.Slovak, 35 },
                new object[] { Language.Latvian, 36 },
                new object[] { Language.SpanishLatino, 37 },
                new object[] { Language.Catalan, 38 },
                new object[] { Language.Croatian, 39 },
                new object[] { Language.Serbian, 40 },
                new object[] { Language.Bosnian, 41 },
                new object[] { Language.Estonian, 42 },
                new object[] { Language.Tamil, 43 },
                new object[] { Language.Indonesian, 44 },
                new object[] { Language.Telugu, 45 },
                new object[] { Language.Macedonian, 46 },
                new object[] { Language.Slovenian, 47 },
                new object[] { Language.Malayalam, 48 },
                new object[] { Language.Kannada, 49 },
                new object[] { Language.Albanian, 50 },
                new object[] { Language.Afrikaans, 51 },
                new object[] { Language.Marathi, 52 },
                new object[] { Language.Tagalog, 53 },
                new object[] { Language.Urdu, 54 },
                new object[] { Language.Romansh, 55 },
                new object[] { Language.Mongolian, 56 }
            };

        [Test]
        [TestCaseSource("FromIntCases")]
        public void should_be_able_to_convert_int_to_languageTypes(int source, Language expected)
        {
            var language = (Language)source;
            language.Should().Be(expected);
        }

        [Test]
        [TestCaseSource("ToIntCases")]
        public void should_be_able_to_convert_languageTypes_to_int(Language source, int expected)
        {
            var i = (int)source;
            i.Should().Be(expected);
        }
    }
}
